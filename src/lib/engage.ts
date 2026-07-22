import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { PORTAL_BASE, portalHref } from "@/lib/paths";
import { bumpMongoStats, recordActivity, syncIssueLiveMetrics } from "@/lib/services";
import type { MediaType } from "@/lib/media";

export const ENGAGE_TARGETS = [
  "meme",
  "report",
  "demand",
  "notice",
  "feed",
  "issue",
  "proposal",
  "comment",
] as const;

export type EngageTarget = (typeof ENGAGE_TARGETS)[number];

export function isEngageTarget(v: string): v is EngageTarget {
  return (ENGAGE_TARGETS as readonly string[]).includes(v);
}

export function score(up: number, down: number) {
  return up - down;
}

/** Ensure the parent post exists for non-comment targets */
export async function assertTargetExists(
  targetType: EngageTarget,
  targetId: string,
): Promise<boolean> {
  switch (targetType) {
    case "meme":
      return Boolean(await prisma.meme.findUnique({ where: { id: targetId } }));
    case "report":
      return Boolean(
        await prisma.citizenReport.findUnique({ where: { id: targetId } }),
      );
    case "demand":
      return Boolean(
        await prisma.publicDemand.findUnique({ where: { id: targetId } }),
      );
    case "notice":
      return Boolean(
        await prisma.notice.findUnique({ where: { id: targetId } }),
      );
    case "issue":
      return Boolean(
        await prisma.issue.findUnique({ where: { slug: targetId } }),
      );
    case "proposal":
      return Boolean(
        await prisma.proposal.findUnique({ where: { id: targetId } }),
      );
    case "comment":
      return Boolean(
        await prisma.engagementComment.findUnique({ where: { id: targetId } }),
      );
    case "feed": {
      await connectMongo();
      const post = await FeedPost.findById(targetId).lean();
      return Boolean(post);
    }
    default:
      return false;
  }
}

async function applyParentVoteDelta(
  targetType: EngageTarget,
  targetId: string,
  upDelta: number,
  downDelta: number,
) {
  if (upDelta === 0 && downDelta === 0) return;

  switch (targetType) {
    case "meme":
      await prisma.meme.update({
        where: { id: targetId },
        data: {
          upvotes: { increment: upDelta },
          downvotes: { increment: downDelta },
        },
      });
      // Keep legacy MemeVote in sync for older meme endpoints
      break;
    case "report":
      await prisma.citizenReport.update({
        where: { id: targetId },
        data: {
          upvotes: { increment: upDelta },
          downvotes: { increment: downDelta },
        },
      });
      break;
    case "demand":
      await prisma.publicDemand.update({
        where: { id: targetId },
        data: {
          upvotes: { increment: upDelta },
          downvotes: { increment: downDelta },
          // supportCount mirrors upvotes for list compatibility
          supportCount: { increment: upDelta },
        },
      });
      break;
    case "notice":
      await prisma.notice.update({
        where: { id: targetId },
        data: {
          upvotes: { increment: upDelta },
          downvotes: { increment: downDelta },
          signatures: { increment: upDelta },
        },
      });
      break;
    case "comment":
      await prisma.engagementComment.update({
        where: { id: targetId },
        data: {
          upvotes: { increment: upDelta },
          downvotes: { increment: downDelta },
        },
      });
      break;
    case "feed": {
      await connectMongo();
      await FeedPost.updateOne(
        { _id: targetId },
        { $inc: { votes: upDelta - downDelta } },
      );
      break;
    }
    case "issue":
      // Issues use discussion comments; social votes live in EngagementVote only
      break;
    case "proposal":
      // Poll votes stay on Vote model; social up/down in EngagementVote
      break;
    default:
      break;
  }

  const net = upDelta - downDelta;
  if (net !== 0 && targetType !== "feed" && targetType !== "comment") {
    await connectMongo();
    await FeedPost.updateOne(
      { refId: targetId },
      { $inc: { votes: net } },
    );
    await bumpMongoStats({ votes: Math.abs(net) });
  }
}

/**
 * Toggle Reddit-style upvote/downvote for any target.
 * Same vote again → remove; opposite → switch.
 */
export async function castEngageVote(opts: {
  targetType: EngageTarget;
  targetId: string;
  voterKey: string;
  value: 1 | -1;
}) {
  const { targetType, targetId, voterKey, value } = opts;
  const existing = await prisma.engagementVote.findUnique({
    where: {
      targetType_targetId_voterKey: { targetType, targetId, voterKey },
    },
  });

  let upDelta = 0;
  let downDelta = 0;
  let myVote: number | null = null;

  if (!existing) {
    await prisma.engagementVote.create({
      data: { targetType, targetId, voterKey, value },
    });
    if (value === 1) upDelta = 1;
    else downDelta = 1;
    myVote = value;
  } else if (existing.value === value) {
    await prisma.engagementVote.delete({ where: { id: existing.id } });
    if (value === 1) upDelta = -1;
    else downDelta = -1;
    myVote = null;
  } else {
    await prisma.engagementVote.update({
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
    myVote = value;
  }

  await applyParentVoteDelta(targetType, targetId, upDelta, downDelta);

  // Keep issue stars / vote counts live when citizens react
  if (targetType === "issue") {
    await syncIssueLiveMetrics(targetId).catch(() => {});
  } else if (targetType === "proposal") {
    const prop = await prisma.proposal.findUnique({
      where: { id: targetId },
      select: { issueSlug: true },
    });
    if (prop?.issueSlug) {
      await syncIssueLiveMetrics(prop.issueSlug).catch(() => {});
    }
  }

  // Dual-write meme votes for /api/memes compatibility
  if (targetType === "meme") {
    const mv = await prisma.memeVote.findUnique({
      where: { memeId_voterKey: { memeId: targetId, voterKey } },
    });
    if (myVote === null && mv) {
      await prisma.memeVote.delete({ where: { id: mv.id } });
    } else if (myVote !== null && !mv) {
      await prisma.memeVote.create({
        data: { memeId: targetId, voterKey, value: myVote },
      });
    } else if (myVote !== null && mv && mv.value !== myVote) {
      await prisma.memeVote.update({
        where: { id: mv.id },
        data: { value: myVote },
      });
    }
  }

  return { myVote, upDelta, downDelta };
}

export async function getEngageCounts(
  targetType: EngageTarget,
  targetId: string,
  voterKey?: string | null,
) {
  let upvotes = 0;
  let downvotes = 0;
  let commentCount = 0;

  switch (targetType) {
    case "meme": {
      const row = await prisma.meme.findUnique({ where: { id: targetId } });
      if (row) {
        upvotes = row.upvotes;
        downvotes = row.downvotes;
        commentCount = row.commentCount;
      }
      break;
    }
    case "report": {
      const row = await prisma.citizenReport.findUnique({
        where: { id: targetId },
      });
      if (row) {
        upvotes = row.upvotes;
        downvotes = row.downvotes;
        commentCount = row.commentCount;
      }
      break;
    }
    case "demand": {
      const row = await prisma.publicDemand.findUnique({
        where: { id: targetId },
      });
      if (row) {
        upvotes = row.upvotes || row.supportCount;
        downvotes = row.downvotes;
        commentCount = row.commentCount;
      }
      break;
    }
    case "notice": {
      const row = await prisma.notice.findUnique({ where: { id: targetId } });
      if (row) {
        upvotes = row.upvotes || Math.max(0, row.signatures - 1);
        downvotes = row.downvotes;
        commentCount = row.commentCount;
      }
      break;
    }
    case "comment": {
      const row = await prisma.engagementComment.findUnique({
        where: { id: targetId },
      });
      if (row) {
        upvotes = row.upvotes;
        downvotes = row.downvotes;
      }
      break;
    }
    case "feed": {
      await connectMongo();
      const post = await FeedPost.findById(targetId).lean();
      if (post && typeof (post as { votes?: number }).votes === "number") {
        upvotes = (post as { votes: number }).votes;
      }
      commentCount = await prisma.engagementComment.count({
        where: { targetType: "feed", targetId, parentId: null },
      });
      break;
    }
    case "issue": {
      const [ups, downs, comments] = await Promise.all([
        prisma.engagementVote.count({
          where: { targetType: "issue", targetId, value: 1 },
        }),
        prisma.engagementVote.count({
          where: { targetType: "issue", targetId, value: -1 },
        }),
        prisma.engagementComment.count({
          where: { targetType: "issue", targetId, parentId: null },
        }),
      ]);
      upvotes = ups;
      downvotes = downs;
      commentCount = comments;
      break;
    }
    case "proposal": {
      const [ups, downs, comments] = await Promise.all([
        prisma.engagementVote.count({
          where: { targetType: "proposal", targetId, value: 1 },
        }),
        prisma.engagementVote.count({
          where: { targetType: "proposal", targetId, value: -1 },
        }),
        prisma.engagementComment.count({
          where: { targetType: "proposal", targetId, parentId: null },
        }),
      ]);
      upvotes = ups;
      downvotes = downs;
      commentCount = comments;
      break;
    }
  }

  let myVote: number | null = null;
  if (voterKey) {
    const v = await prisma.engagementVote.findUnique({
      where: {
        targetType_targetId_voterKey: { targetType, targetId, voterKey },
      },
    });
    myVote = v?.value ?? null;
  }

  return {
    upvotes,
    downvotes,
    commentCount,
    score: score(upvotes, downvotes),
    myVote,
  };
}

export async function createEngageComment(opts: {
  targetType: Exclude<EngageTarget, "comment">;
  targetId: string;
  voterKey: string;
  body: string;
  parentId?: string | null;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
}) {
  const { targetType, targetId, voterKey, body } = opts;
  const parentId = opts.parentId?.trim() || null;
  const mediaUrl = opts.mediaUrl?.trim() || null;
  const mediaType = opts.mediaType ?? null;

  if (parentId) {
    const parent = await prisma.engagementComment.findUnique({
      where: { id: parentId },
    });
    if (!parent || parent.targetType !== targetType || parent.targetId !== targetId) {
      throw new Error("Invalid reply parent");
    }
  }

  const author = await publicAuthorFromVoterKey(voterKey);
  if (!author) throw new Error("Anonymous identity required");

  if (!body.trim() && !mediaUrl) {
    throw new Error("Write a comment or attach media");
  }

  const comment = await prisma.engagementComment.create({
    data: {
      targetType,
      targetId,
      parentId,
      body: body.trim() || (mediaType === "video" ? "Shared a video" : "Shared media"),
      authorLabel: author.authorLabel,
      authorAnonId: author.authorAnonId,
      authorHash: voterKey,
      mediaUrl,
      mediaType,
    },
  });

  // Only top-level comments bump parent commentCount
  if (!parentId) {
    await bumpCommentCount(targetType, targetId, 1);
  }

  if (targetType === "issue") {
    await syncIssueLiveMetrics(targetId).catch(() => {});
  } else if (targetType === "proposal") {
    const prop = await prisma.proposal.findUnique({
      where: { id: targetId },
      select: { issueSlug: true },
    });
    if (prop?.issueSlug) {
      await syncIssueLiveMetrics(prop.issueSlug).catch(() => {});
    }
  }

  await recordActivity({
    kind: "discussion",
    summary: parentId
      ? `Replied as ${author.authorAnonId}`
      : `Commented as ${author.authorAnonId}`,
    href: hrefForTarget(targetType, targetId),
  });

  return comment;
}

export async function updateEngageComment(opts: {
  commentId: string;
  voterKey: string;
  body: string;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
}) {
  const row = await prisma.engagementComment.findUnique({
    where: { id: opts.commentId },
  });
  if (!row) throw new Error("Not found");
  if (!row.authorHash || row.authorHash !== opts.voterKey) {
    throw new Error("Forbidden");
  }

  const text = opts.body.trim();
  const mediaUrl =
    opts.mediaUrl === undefined ? row.mediaUrl : opts.mediaUrl?.trim() || null;
  const mediaType =
    opts.mediaType === undefined ? row.mediaType : opts.mediaType;

  if (!text && !mediaUrl) {
    throw new Error("Write a comment or attach media");
  }
  if (text.length > 4000) {
    throw new Error("Comment must be at most 4000 characters");
  }

  return prisma.engagementComment.update({
    where: { id: opts.commentId },
    data: {
      body:
        text ||
        (mediaType === "video" ? "Shared a video" : "Shared media"),
      mediaUrl,
      mediaType,
    },
  });
}

export async function deleteEngageComment(opts: {
  commentId: string;
  voterKey: string;
}) {
  const row = await prisma.engagementComment.findUnique({
    where: { id: opts.commentId },
  });
  if (!row) throw new Error("Not found");
  if (!row.authorHash || row.authorHash !== opts.voterKey) {
    throw new Error("Forbidden");
  }

  // Cascade: collect this comment and all descendants on the same target
  const allOnTarget = await prisma.engagementComment.findMany({
    where: { targetType: row.targetType, targetId: row.targetId },
    select: { id: true, parentId: true },
  });
  const toDelete = new Set<string>([row.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of allOnTarget) {
      if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
        toDelete.add(c.id);
        grew = true;
      }
    }
  }
  const ids = [...toDelete];

  await prisma.engagementVote.deleteMany({
    where: { targetType: "comment", targetId: { in: ids } },
  });
  await prisma.engagementComment.deleteMany({
    where: { id: { in: ids } },
  });

  // Top-level comment removed → decrement parent counter
  if (!row.parentId) {
    await bumpCommentCount(row.targetType, row.targetId, -1);
  }

  return { targetType: row.targetType, targetId: row.targetId };
}

async function bumpCommentCount(
  targetType: string,
  targetId: string,
  delta: number,
) {
  switch (targetType) {
    case "meme":
      await prisma.meme.update({
        where: { id: targetId },
        data: { commentCount: { increment: delta } },
      });
      break;
    case "report":
      await prisma.citizenReport.update({
        where: { id: targetId },
        data: { commentCount: { increment: delta } },
      });
      break;
    case "demand":
      await prisma.publicDemand.update({
        where: { id: targetId },
        data: { commentCount: { increment: delta } },
      });
      break;
    case "notice":
      await prisma.notice.update({
        where: { id: targetId },
        data: { commentCount: { increment: delta } },
      });
      break;
    default:
      break;
  }
}

export function hrefForTarget(targetType: string, targetId: string) {
  switch (targetType) {
    case "meme":
      return portalHref(`/memes/${targetId}`);
    case "report":
      return portalHref(`/reports/${targetId}`);
    case "demand":
      return portalHref(`/petitions/${targetId}`);
    case "notice":
      return portalHref(`/notice/${targetId}`);
    case "issue":
      return portalHref(`/issues/${targetId}`);
    case "proposal":
      return portalHref(`/vote/${targetId}`);
    case "feed":
      return portalHref(`/feed`);
    default:
      return PORTAL_BASE;
  }
}

export type PublicComment = {
  id: string;
  body: string;
  authorLabel: string;
  authorAnonId: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: number | null;
  isMine: boolean;
  createdAt: string;
  updatedAt?: string;
  parentId: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  replies: PublicComment[];
};

export async function listEngageComments(
  targetType: string,
  targetId: string,
  voterKey?: string | null,
): Promise<PublicComment[]> {
  const rows = await prisma.engagementComment.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "asc" },
  });

  const myVotes = new Map<string, number>();
  if (voterKey && rows.length) {
    const votes = await prisma.engagementVote.findMany({
      where: {
        targetType: "comment",
        targetId: { in: rows.map((r) => r.id) },
        voterKey,
      },
    });
    for (const v of votes) myVotes.set(v.targetId, v.value);
  }

  const byId = new Map<string, PublicComment>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      body: r.body,
      authorLabel: r.authorLabel,
      authorAnonId: r.authorAnonId,
      upvotes: r.upvotes,
      downvotes: r.downvotes,
      score: score(r.upvotes, r.downvotes),
      myVote: myVotes.get(r.id) ?? null,
      isMine: Boolean(voterKey && r.authorHash && r.authorHash === voterKey),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt?.toISOString?.() ?? undefined,
      parentId: r.parentId,
      mediaUrl: r.mediaUrl,
      mediaType: r.mediaType,
      replies: [],
    });
  }

  const roots: PublicComment[] = [];
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(c);
    } else {
      roots.push(c);
    }
  }

  // Newest replies last; top-level newest first for feed feel
  roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return roots;
}
