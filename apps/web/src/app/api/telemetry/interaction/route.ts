import { NextResponse } from "next/server";
import { assertRateLimit, hashClientFingerprint } from "@/lib/anti-bot";
import { assertSameOrigin } from "@/lib/origin";
import { rules } from "@/lib/config";
import {
  isAllowedInteractionName,
  recordInteraction,
} from "@/lib/interactions";
import { isValidVisitorId } from "@/lib/telemetry";
import { resolveSessionFromRequest } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * Ingest product interaction events from the browser.
 * Never accepts or returns phone numbers.
 */
export async function POST(req: Request) {
  const cfg = rules.interactions();
  if (!cfg.enabled) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const origin = assertSameOrigin(req);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: 403 });
  }

  const fp = hashClientFingerprint(req);
  const rl = await assertRateLimit(
    `interaction:${fp}`,
    cfg.rateLimitPerMinute,
    60 * 1000,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (cfg.honorDoNotTrack && body.doNotTrack === true) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const visitorId = body.visitorId;
  if (!isValidVisitorId(visitorId)) {
    return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
  }

  const auth = await resolveSessionFromRequest(req);
  let anonId: string | null = null;
  if (auth?.phoneHash) {
    const identity = await prisma.phoneIdentity.findUnique({
      where: { phoneHash: auth.phoneHash },
      select: { anonId: true },
    });
    anonId = identity?.anonId ?? null;
  }

  const rawEvents = Array.isArray(body.events) ? body.events : [body];
  const events = rawEvents.slice(0, cfg.maxEventsPerBatch);
  let accepted = 0;

  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const e = ev as Record<string, unknown>;
    const name = String(e.name ?? "").trim();
    if (!isAllowedInteractionName(name)) continue;

    const result = await recordInteraction({
      name,
      surface: typeof e.surface === "string" ? e.surface : "web",
      visitorId,
      sessionId: typeof e.sessionId === "string" ? e.sessionId : null,
      anonId,
      path: typeof e.path === "string" ? e.path : null,
      targetType: typeof e.targetType === "string" ? e.targetType : null,
      targetId: typeof e.targetId === "string" ? e.targetId : null,
      props:
        e.props && typeof e.props === "object" && !Array.isArray(e.props)
          ? (e.props as Record<string, unknown>)
          : null,
      req,
    });
    if (result.ok) accepted += 1;
  }

  return NextResponse.json({ ok: true, accepted });
}
