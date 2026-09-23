import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { publicReport } from "@/lib/phone";
import { bumpMongoStats, recordActivity } from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const REACTIONS = new Set([
  "support",
  "concerned",
  "angry",
  "sad",
  "important",
]);

function locationLabel(r: {
  village: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  country: string;
  locationLevel: string;
}) {
  const parts = [r.village, r.block, r.district, r.state, r.country].filter(
    Boolean,
  );
  return parts.join(", ");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = await prisma.citizenReport.findUnique({
    where: { id },
    include: {
      reactions: true,
      _count: { select: { reportVotes: true, reactions: true } },
    },
  });
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reactionCounts: Record<string, number> = {};
  for (const react of report.reactions) {
    reactionCounts[react.reaction] = (reactionCounts[react.reaction] ?? 0) + 1;
  }
  const { reactions: _r, authorHash: _h, ...rest } = report;

  return NextResponse.json({
    report: {
      ...rest,
      locationLabel: locationLabel(report),
      reactionCounts,
      voteCount: report._count.reportVotes,
      reactionTotal: report._count.reactions,
    },
  });
}

/** Upvote / endorse / dispute — requires anonymous phone voterKey */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "report-engage",
    body,
    req,
    phoneRequired: true,
    limit: 100,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const choice = String(body.choice ?? "upvote");
  const action = String(body.action ?? "vote"); // vote | react

  if (!voterKey || voterKey.length < 32) {
    return NextResponse.json(
      { error: "Verify your phone to vote anonymously" },
      { status: 401 },
    );
  }

  const report = await prisma.citizenReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "react") {
    const reaction = String(body.reaction ?? "support");
    if (!REACTIONS.has(reaction)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }
    try {
      await prisma.reportReaction.create({
        data: { reportId: id, voterKey, reaction },
      });
    } catch {
      await prisma.reportReaction.deleteMany({
        where: { reportId: id, voterKey, reaction },
      });
      return NextResponse.json({ ok: true, toggledOff: true });
    }
    await recordActivity({
      kind: "discussion",
      summary: `Reaction on: ${report.title}`,
      href: `/reports/${id}`,
    });
    return NextResponse.json({ ok: true, reaction });
  }

  // vote
  if (!["upvote", "endorse", "dispute"].includes(choice)) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  const existing = await prisma.reportVote.findUnique({
    where: { reportId_voterKey: { reportId: id, voterKey } },
  });

  await prisma.reportVote.upsert({
    where: { reportId_voterKey: { reportId: id, voterKey } },
    update: { choice },
    create: { reportId: id, voterKey, choice },
  });

  if (!existing && choice === "upvote") {
    await prisma.citizenReport.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
    await connectMongo();
    await FeedPost.updateOne({ refId: id }, { $inc: { votes: 1 } });
    await bumpMongoStats({ votes: 1, citizens: 1 });
  } else if (existing?.choice === "upvote" && choice !== "upvote") {
    await prisma.citizenReport.update({
      where: { id },
      data: { upvotes: { decrement: 1 } },
    });
  } else if (!existing) {
    await bumpMongoStats({ citizens: 1 });
  }

  await recordActivity({
    kind: "vote",
    summary: `Anonymous ${choice} on: ${report.title}`,
    href: `/reports/${id}`,
  });

  const updated = await prisma.citizenReport.findUnique({ where: { id } });
  return NextResponse.json({
    ok: true,
    report: updated ? publicReport(updated) : null,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "report-edit",
    body,
    req,
    phoneRequired: true,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const report = await prisma.citizenReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { assertContentOwner, updateFeedMirrors } = await import(
    "@/lib/own-content"
  );
  const ok = await assertContentOwner({
    phoneHash: voterKey,
    authorHash: report.authorHash,
    authorAnonId: report.authorAnonId,
  });
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  if (!title || !text) {
    return NextResponse.json(
      { error: "title and body required" },
      { status: 400 },
    );
  }

  const updated = await prisma.citizenReport.update({
    where: { id },
    data: { title, body: text },
  });

  await updateFeedMirrors(
    { refId: id },
    {
      title,
      excerpt: text.slice(0, 220),
      body: text,
    },
  );

  return NextResponse.json({ report: publicReport(updated), isMine: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const gate = await guardAnonymousWrite({
    action: "report-delete",
    body,
    req,
    phoneRequired: true,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const report = await prisma.citizenReport.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const {
    assertContentOwner,
    deleteEngageForTarget,
    deleteFeedMirrors,
  } = await import("@/lib/own-content");
  const ok = await assertContentOwner({
    phoneHash: voterKey,
    authorHash: report.authorHash,
    authorAnonId: report.authorAnonId,
  });
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteEngageForTarget("report", id);
  await deleteFeedMirrors({ refId: id });
  await prisma.citizenReport.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
