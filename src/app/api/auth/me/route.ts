import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAnonIdForHash } from "@/lib/identity";
import { resolveSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Soft-refresh public session fields from the httpOnly cookie. */
export async function GET(req: Request) {
  const session = await resolveSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const identity = await prisma.phoneIdentity.findUnique({
    where: { phoneHash: session.phoneHash },
  });
  if (!identity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let anonId = identity.anonId;
  if (!anonId) {
    const ensured = await ensureAnonIdForHash(
      session.phoneHash,
      identity.phoneHint,
    );
    anonId = ensured.anonId;
  }

  return NextResponse.json({
    session: {
      hint: identity.phoneHint,
      anonId,
      anonymous: true,
      authenticated: true,
    },
  });
}
