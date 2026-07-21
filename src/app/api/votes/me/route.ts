import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const voterKey = searchParams.get("voterKey");
  const proposalId = searchParams.get("proposalId");
  if (!voterKey || !proposalId) {
    return NextResponse.json(
      { error: "voterKey and proposalId required" },
      { status: 400 },
    );
  }
  const vote = await prisma.vote.findUnique({
    where: {
      proposalId_voterKey: { proposalId, voterKey },
    },
  });
  if (!vote) return NextResponse.json({ vote: null });
  return NextResponse.json({
    vote: { ...vote, choice: JSON.parse(vote.choice) },
  });
}
