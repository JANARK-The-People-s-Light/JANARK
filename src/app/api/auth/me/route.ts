import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureAnonIdForHash } from "@/lib/identity";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Soft-refresh session fields for an existing phone voterKey (hash). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const voterKey = searchParams.get("voterKey")?.trim();
  if (!voterKey || voterKey.length < 32) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const identity = await prisma.phoneIdentity.findUnique({
    where: { phoneHash: voterKey },
  });
  if (!identity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let anonId = identity.anonId;
  if (!anonId) {
    const ensured = await ensureAnonIdForHash(voterKey, identity.phoneHint);
    anonId = ensured.anonId;
  }

  return NextResponse.json({
    session: {
      voterKey: identity.phoneHash,
      hint: identity.phoneHint,
      anonId,
      anonymous: true,
    },
  });
}
