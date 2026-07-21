import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { Discussion } from "@/lib/mongo-models";
import {
  displayAnonLabel,
  identityByAnonId,
  isValidAnonId,
} from "@/lib/identity";
import { publicMeme, score } from "@/lib/memes";
import { publicReport } from "@/lib/phone";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Ctx = { params: Promise<{ anonId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { anonId: raw } = await ctx.params;
  const anonId = raw.toLowerCase();
  if (!isValidAnonId(anonId)) {
    return NextResponse.json({ error: "Invalid anonymity ID" }, { status: 400 });
  }

  const identity = await identityByAnonId(anonId);
  if (!identity) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const phoneHash = identity.phoneHash;
  const label = displayAnonLabel(anonId);

  const [
    memes,
    reports,
    demands,
    notices,
    memeVotes,
    reportReactions,
    reportVotes,
    demandSupports,
    proposalVotes,
    noticeSignatures,
  ] = await Promise.all([
    prisma.meme.findMany({
      where: {
        OR: [{ authorAnonId: anonId }, { authorHash: phoneHash }],
      },
      include: { tags: { include: { hashtag: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.citizenReport.findMany({
      where: {
        OR: [{ authorAnonId: anonId }, { authorHash: phoneHash }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.publicDemand.findMany({
      where: {
        OR: [{ authorAnonId: anonId }, { authorHash: phoneHash }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notice.findMany({
      where: { authorAnonId: anonId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.memeVote.findMany({
      where: { voterKey: phoneHash },
      include: { meme: { select: { id: true, title: true, imageUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.reportReaction.findMany({
      where: { voterKey: phoneHash },
      include: {
        report: { select: { id: true, title: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.reportVote.findMany({
      where: { voterKey: phoneHash },
      include: {
        report: { select: { id: true, title: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.demandSupport.findMany({
      where: { voterKey: phoneHash },
      include: {
        demand: { select: { id: true, title: true, ask: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.vote.findMany({
      where: { voterKey: phoneHash },
      include: {
        proposal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.signature.findMany({
      where: { signerKey: phoneHash },
      include: {
        notice: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  await connectMongo();
  const discussions = await Discussion.find({
    $or: [{ authorAnonId: anonId }, { authorHash: phoneHash }],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("-authorHash -voters")
    .lean();

  const posts = {
    memes: memes.map((m) => {
      const pub = publicMeme(m);
      return {
        id: pub.id,
        title: pub.title,
        caption: pub.caption,
        imageUrl: pub.imageUrl,
        authorLabel: pub.authorLabel,
        authorAnonId: pub.authorAnonId ?? anonId,
        upvotes: pub.upvotes,
        downvotes: pub.downvotes,
        score: score(pub.upvotes, pub.downvotes),
        tags: m.tags.map((t) => t.hashtag.tag),
        href: `/memes/${pub.id}`,
        createdAt: pub.createdAt,
      };
    }),
    reports: reports.map((r) => {
      const pub = publicReport(r);
      return {
        id: pub.id,
        type: pub.type,
        title: pub.title,
        authorLabel: pub.authorLabel,
        authorAnonId: pub.authorAnonId ?? anonId,
        upvotes: pub.upvotes,
        href: `/reports/${pub.id}`,
        createdAt: pub.createdAt,
      };
    }),
    demands: demands.map((d) => {
      const { authorHash: _h, ...rest } = d;
      return {
        id: rest.id,
        title: rest.title,
        ask: rest.ask,
        supportCount: rest.supportCount,
        authorLabel: rest.authorLabel,
        authorAnonId: rest.authorAnonId ?? anonId,
        href: `/demands/${rest.id}`,
        createdAt: rest.createdAt,
      };
    }),
    notices: notices.map((n) => ({
      id: n.id,
      title: n.title,
      target: n.target,
      signatures: n.signatures,
      author: n.author,
      authorAnonId: n.authorAnonId ?? anonId,
      href: `/notice/${n.id}`,
      createdAt: n.createdAt,
    })),
    discussions: discussions.map((d) => ({
      id: String(d._id),
      body: d.body,
      kind: d.kind,
      author: d.author,
      authorAnonId: d.authorAnonId ?? anonId,
      issueSlug: d.issueSlug,
      feedPostId: d.feedPostId,
      href: d.issueSlug
        ? `/issues/${d.issueSlug}`
        : d.feedPostId
          ? `/feed?post=${d.feedPostId}`
          : "/feed",
      createdAt: d.createdAt,
    })),
  };

  const reactions = {
    memeVotes: memeVotes.map((v) => ({
      id: v.id,
      choice: v.value === 1 ? "upvote" : "downvote",
      title: v.meme.title,
      href: `/memes/${v.memeId}`,
      createdAt: v.createdAt,
    })),
    reportReactions: reportReactions.map((r) => ({
      id: r.id,
      reaction: r.reaction,
      title: r.report.title,
      type: r.report.type,
      href: `/reports/${r.reportId}`,
      createdAt: r.createdAt,
    })),
    reportVotes: reportVotes.map((v) => ({
      id: v.id,
      choice: v.choice,
      title: v.report.title,
      href: `/reports/${v.reportId}`,
      createdAt: v.createdAt,
    })),
    demandSupports: demandSupports.map((s) => ({
      id: s.id,
      title: s.demand.title,
      ask: s.demand.ask,
      href: `/demands/${s.demandId}`,
      createdAt: s.createdAt,
    })),
    proposalVotes: proposalVotes.map((v) => ({
      id: v.id,
      choice: v.choice,
      title: v.proposal.title,
      href: `/vote/${v.proposalId}`,
      createdAt: v.createdAt,
    })),
    noticeSignatures: noticeSignatures.map((s) => ({
      id: s.id,
      title: s.notice.title,
      href: `/notice/${s.noticeId}`,
      createdAt: s.createdAt,
    })),
  };

  const counts = {
    posts:
      posts.memes.length +
      posts.reports.length +
      posts.demands.length +
      posts.notices.length +
      posts.discussions.length,
    reactions:
      reactions.memeVotes.length +
      reactions.reportReactions.length +
      reactions.reportVotes.length +
      reactions.demandSupports.length +
      reactions.proposalVotes.length +
      reactions.noticeSignatures.length,
    memberSince: identity.createdAt,
  };

  return NextResponse.json({
    profile: {
      anonId,
      label,
      memberSince: identity.createdAt,
      // never expose phoneHash / phoneHint publicly
    },
    counts,
    posts,
    reactions,
  });
}
