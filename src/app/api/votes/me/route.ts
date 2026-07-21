import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const proposalId = searchParams.get("proposalId");
  const session = await resolveSessionFromRequest(req);
  if (!session || !proposalId) {
    return NextResponse.json(
      { error: "proposalId required (and authenticated session)" },
      { status: 400 },
    );
  }
  const vote = await prisma.vote.findUnique({
    where: {
      proposalId_voterKey: {
        proposalId,
        voterKey: session.phoneHash,
      },
    },
  });
  if (!vote) return NextResponse.json({ vote: null });
  return NextResponse.json({
    vote: { ...vote, choice: JSON.parse(vote.choice) },
  });
}
