import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { ownsByAnonId, ownsByHash } from "@/lib/ownership";

export { ownsByAnonId, ownsByHash } from "@/lib/ownership";

/** Resolve whether phoneHash owns a row with authorHash and/or authorAnonId. */
export async function assertContentOwner(opts: {
  phoneHash: string;
  authorHash?: string | null;
  authorAnonId?: string | null;
}): Promise<boolean> {
  if (ownsByHash(opts.authorHash, opts.phoneHash)) return true;
  if (!opts.authorAnonId) return false;
  const author = await publicAuthorFromVoterKey(opts.phoneHash);
  return ownsByAnonId(opts.authorAnonId, author?.authorAnonId);
}

/** Remove Mongo feed mirror(s) for a Prisma entity. */
export async function deleteFeedMirrors(opts: {
  refId?: string;
  type?: string;
  feedPostId?: string;
}) {
  await connectMongo();
  if (opts.feedPostId) {
    await FeedPost.deleteOne({ _id: opts.feedPostId }).catch(() => null);
  }
  if (opts.refId) {
    const filter: Record<string, unknown> = { refId: opts.refId };
    if (opts.type) filter.type = opts.type;
    await FeedPost.deleteMany(filter).catch(() => null);
  }
}

/** Update caption/title/excerpt on matching FeedPost mirrors. */
export async function updateFeedMirrors(
  opts: {
    refId?: string;
    type?: string;
    feedPostId?: string;
  },
  patch: {
    title?: string;
    excerpt?: string;
    body?: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
  },
) {
  await connectMongo();
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.excerpt !== undefined) data.excerpt = patch.excerpt;
  if (patch.body !== undefined) data.body = patch.body;
  if (patch.mediaUrl !== undefined) data.mediaUrl = patch.mediaUrl;
  if (patch.mediaType !== undefined) data.mediaType = patch.mediaType;
  if (Object.keys(data).length === 0) return;

  if (opts.feedPostId) {
    await FeedPost.updateOne({ _id: opts.feedPostId }, { $set: data }).catch(
      () => null,
    );
  }
  if (opts.refId) {
    const filter: Record<string, unknown> = { refId: opts.refId };
    if (opts.type) filter.type = opts.type;
    await FeedPost.updateMany(filter, { $set: data }).catch(() => null);
  }
}

/** Delete engagement comments + votes for a target (and nested comment votes). */
export async function deleteEngageForTarget(
  targetType: string,
  targetId: string,
) {
  const comments = await prisma.engagementComment.findMany({
    where: { targetType, targetId },
    select: { id: true },
  });
  const commentIds = comments.map((c) => c.id);
  if (commentIds.length) {
    await prisma.engagementVote.deleteMany({
      where: { targetType: "comment", targetId: { in: commentIds } },
    });
  }
  await prisma.engagementComment.deleteMany({
    where: { targetType, targetId },
  });
  await prisma.engagementVote.deleteMany({
    where: { targetType, targetId },
  });
}
