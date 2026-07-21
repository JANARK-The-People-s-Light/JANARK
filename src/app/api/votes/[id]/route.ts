import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import {
  bumpTrend,
  getLiveVoteTallies,
  mapProposal,
  recordActivity,
} from "@/lib/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const tallies = await getLiveVoteTallies(id);
  return NextResponse.json({
    ...mapProposal(proposal),
    liveVotes: tallies.liveVotes,
    results: tallies.results,
    totalVotes: tallies.liveVotes,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "proposal-vote",
    body,
    req,
    phoneRequired: true,
    limit: 80,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const choice = body.choice;

  if (!voterKey || choice == null) {
    return NextResponse.json(
      { error: "voterKey and choice required" },
      { status: 400 },
    );
  }

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const choiceStr = JSON.stringify(choice);
  const existing = await prisma.vote.findUnique({
    where: { proposalId_voterKey: { proposalId: id, voterKey } },
  });

  const vote = await prisma.vote.upsert({
    where: { proposalId_voterKey: { proposalId: id, voterKey } },
    update: { choice: choiceStr },
    create: { proposalId: id, voterKey, choice: choiceStr },
  });

  const tallies = await getLiveVoteTallies(id);
  await prisma.proposal.update({
    where: { id },
    data: { totalVotes: tallies.liveVotes },
  });

  if (proposal.issueSlug && !existing) {
    await prisma.issue.update({
      where: { slug: proposal.issueSlug },
      data: { voteCount: { increment: 1 } },
    });
  }

  await connectMongo();
  await FeedPost.updateOne(
    { refId: id },
    { $inc: { votes: existing ? 0 : 1 }, $set: { hot: true } },
  );
  if (!existing) {
    await bumpTrend(proposal.title.split(" ")[0] ?? "Vote", 1);
    await recordActivity({
      kind: "vote",
      summary: `Vote cast on ${proposal.title}`,
      href: `/vote/${id}`,
      meta: { choice },
    });
  }

  return NextResponse.json({
    ok: true,
    vote,
    liveVotes: tallies.liveVotes,
    results: tallies.results,
  });
}
