import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { bumpMongoStats, recordActivity } from "@/lib/services";
import { publicMeme, score } from "@/lib/memes";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function serialize(
  meme: {
    id: string;
    title: string;
    caption: string | null;
    imageUrl: string;
    sourceUrl: string | null;
    authorLabel: string;
    authorHash?: string | null;
    upvotes: number;
    downvotes: number;
    shareCount: number;
    createdAt: Date;
    updatedAt: Date;
    tags?: { hashtag: { tag: string } }[];
  },
  myVote?: number | null,
) {
  return {
    ...publicMeme(meme),
    tags: (meme.tags ?? []).map((t) => t.hashtag.tag),
    score: score(meme.upvotes, meme.downvotes),
    myVote: myVote ?? null,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const voterKey = new URL(req.url).searchParams.get("voterKey");
  const meme = await prisma.meme.findUnique({
    where: { id },
    include: {
      tags: { include: { hashtag: true } },
      votes: voterKey ? { where: { voterKey }, take: 1 } : false,
    },
  });
  if (!meme) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const myVote =
    Array.isArray(meme.votes) && meme.votes[0] ? meme.votes[0].value : null;
  const { votes: _v, ...rest } = meme;
  return NextResponse.json({ meme: serialize(rest, myVote) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action ?? "vote");

  const meme = await prisma.meme.findUnique({ where: { id } });
  if (!meme) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "share") {
    const gate = await guardAnonymousWrite({
      action: "meme-share",
      body,
      req,
      phoneRequired: true,
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });
    if (!gate.ok) return guardFail(gate);

    const updated = await prisma.meme.update({
      where: { id },
      data: { shareCount: { increment: 1 } },
      include: { tags: { include: { hashtag: true } } },
    });
    await recordActivity({
      kind: "share",
      summary: `Shared meme: ${meme.title}`,
      href: `/memes/${id}`,
    });
    return NextResponse.json({ ok: true, meme: serialize(updated) });
  }

  const gate = await guardAnonymousWrite({
    action: "meme-vote",
    body,
    req,
    phoneRequired: true,
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const choice = String(body.choice ?? "upvote");
  const value = choice === "downvote" ? -1 : 1;

  const existing = await prisma.memeVote.findUnique({
    where: { memeId_voterKey: { memeId: id, voterKey } },
  });

  let upDelta = 0;
  let downDelta = 0;

  if (!existing) {
    await prisma.memeVote.create({
      data: { memeId: id, voterKey, value },
    });
    if (value === 1) upDelta = 1;
    else downDelta = 1;
  } else if (existing.value === value) {
    await prisma.memeVote.delete({ where: { id: existing.id } });
    if (value === 1) upDelta = -1;
    else downDelta = -1;
  } else {
    await prisma.memeVote.update({
      where: { id: existing.id },
      data: { value },
    });
    if (value === 1) {
      upDelta = 1;
      downDelta = -1;
    } else {
      upDelta = -1;
      downDelta = 1;
    }
  }

  const updated = await prisma.meme.update({
    where: { id },
    data: {
      upvotes: { increment: upDelta },
      downvotes: { increment: downDelta },
    },
    include: {
      tags: { include: { hashtag: true } },
      votes: { where: { voterKey }, take: 1 },
    },
  });

  const net = upDelta - downDelta;
  if (net !== 0) {
    await connectMongo();
    await FeedPost.updateOne({ refId: id }, { $inc: { votes: net } });
    await bumpMongoStats({ votes: Math.abs(net) });
  }

  const myVote = updated.votes[0]?.value ?? null;
  const { votes: _v, ...rest } = updated;
  return NextResponse.json({
    ok: true,
    meme: serialize(rest, myVote),
  });
}
