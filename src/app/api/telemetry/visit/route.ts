import { NextResponse } from "next/server";
import { assertRateLimit, hashClientFingerprint } from "@/lib/anti-bot";
import { assertSameOrigin } from "@/lib/origin";
import { resolveSessionFromRequest } from "@/lib/session";
import {
  isValidVisitorId,
  linkVisitorToPhone,
  upsertVisitSession,
} from "@/lib/telemetry";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * Ingest visit telemetry. Never accepts or returns phone numbers.
 * When an auth session cookie is present, links visitorId → phoneHash server-side.
 */
export async function POST(req: Request) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: 403 });
  }

  const fp = hashClientFingerprint(req);
  const rl = await assertRateLimit(`telemetry:${fp}`, 120, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const visitorId = body.visitorId;
  if (!isValidVisitorId(visitorId)) {
    return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
  }

  const client =
    body.client && typeof body.client === "object"
      ? (body.client as Record<string, unknown>)
      : {};

  const events = Array.isArray(body.events) ? body.events : [];

  const auth = await resolveSessionFromRequest(req);
  let phoneHash: string | null = null;
  let anonId: string | null = null;
  if (auth) {
    phoneHash = auth.phoneHash;
    const { prisma } = await import("@/lib/db");
    const identity = await prisma.phoneIdentity.findUnique({
      where: { phoneHash: auth.phoneHash },
      select: { anonId: true },
    });
    anonId = identity?.anonId ?? null;
    await linkVisitorToPhone({
      visitorId,
      phoneHash: auth.phoneHash,
      anonId,
    });
  }

  const result = await upsertVisitSession({
    req,
    visitorId,
    sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
    client,
    events: events as Array<{ kind: string; path?: string; data?: unknown }>,
    phoneHash,
    anonId,
  });

  // Never echo phoneHash / IP / full snapshot
  return NextResponse.json({
    ok: true,
    sessionId: result.sessionId,
    visitorId: result.visitorId,
  });
}
