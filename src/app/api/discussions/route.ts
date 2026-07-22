import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import { Discussion, FeedPost } from "@/lib/mongo-models";
import { prisma } from "@/lib/db";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { bumpTopicTrends, recordActivity } from "@/lib/services";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { parseOptionalMedia } from "@/lib/media";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";
import { allocatePublicPostId, publicPostHref } from "@/lib/public-id";
import {
  buildFeedTags,
  collectTopicHashtags,
} from "@/lib/hashtags";
import { ensureHashtagCatalog } from "@/lib/ensure-hashtags";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  await connectMongo();
  const { searchParams } = new URL(req.url);
  const issueSlug = searchParams.get("issueSlug");
  const feedPostId = searchParams.get("feedPostId");

  const filter: Record<string, string> = {};
  if (issueSlug) filter.issueSlug = issueSlug;
  if (feedPostId) filter.feedPostId = feedPostId;

  const discussions = await Discussion.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .select("-authorHash -voters")
    .lean();

  return NextResponse.json({
    discussions: discussions.map((d) => ({
      id: String(d._id),
      issueSlug: d.issueSlug,
      feedPostId: d.feedPostId,
      author: d.author,
      authorAnonId: d.authorAnonId ?? null,
      body: d.body,
      kind: d.kind,
      upvotes: d.upvotes,
      mediaUrl: d.mediaUrl ?? null,
      mediaType: d.mediaType ?? null,
      createdAt: d.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  await connectMongo();
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "discussion",
    body,
    req,
    phoneRequired: true,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);
  const terms = requireCivicPostTerms(body);
  if (!terms.ok) {
    return NextResponse.json({ error: terms.error }, { status: 400 });
  }

  const voterKey = String(body.voterKey ?? "").trim();
  const publicAuthor = await publicAuthorFromVoterKey(voterKey);
  if (!publicAuthor) {
    return NextResponse.json(
      { error: "Verify your phone to post" },
      { status: 401 },
    );
  }

  const text = String(body.body ?? "").trim();
  const author = publicAuthor.authorLabel;
  const authorAnonId = publicAuthor.authorAnonId;
  const kind = ["opinion", "evidence", "news"].includes(String(body.kind))
    ? String(body.kind)
    : "opinion";
  const issueSlug = body.issueSlug ? String(body.issueSlug) : undefined;
  const feedPostId = body.feedPostId ? String(body.feedPostId) : undefined;
  const title = body.title ? String(body.title).trim() : undefined;

  if (!text) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  let linkedFeedId = feedPostId;
  let createdPublicId: string | null = null;
  let createdHref: string | null = null;

  if (!issueSlug && !feedPostId && title) {
    const topics = collectTopicHashtags({
      hashtags: body.hashtags ?? body.tags,
      texts: [title, text],
    });
    await ensureHashtagCatalog(topics);
    const publicId = await allocatePublicPostId();
    const post = await FeedPost.create({
      type: "discussion",
      title,
      excerpt: text.slice(0, 220),
      body: text,
      publicId,
      href: publicPostHref(publicId),
      meta: "Open discussion · new",
      votes: 0,
      hot: true,
      tags: buildFeedTags(["discussion"], topics),
      author,
      authorAnonId,
      mediaUrl: media.mediaUrl ?? undefined,
      mediaType: media.mediaType ?? undefined,
    });
    linkedFeedId = String(post._id);
    createdPublicId = publicId;
    createdHref = publicPostHref(publicId);
    await bumpTopicTrends(topics, 2, "discussion");
  }

  const discussion = await Discussion.create({
    issueSlug,
    feedPostId: linkedFeedId,
    author,
    authorAnonId,
    authorHash: voterKey,
    body: text,
    kind,
    upvotes: 0,
    voters: [],
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
  });

  if (issueSlug) {
    const issue = await prisma.issue.findUnique({ where: { slug: issueSlug } });
    if (issue) {
      await prisma.comment.create({
        data: {
          issueSlug,
          author,
          authorAnonId,
          body: text,
          kind,
          upvotes: 0,
        },
      });
    }
  }

  await recordActivity({
    kind: "discussion",
    summary: `${author}: ${text.slice(0, 80)}`,
    href:
      createdHref ||
      (issueSlug ? `/issues/${issueSlug}` : "/feed"),
  });

  return NextResponse.json(
    {
      discussion: {
        id: String(discussion._id),
        issueSlug: discussion.issueSlug,
        feedPostId: discussion.feedPostId,
        publicId: createdPublicId,
        href: createdHref,
        author: discussion.author,
        authorAnonId: discussion.authorAnonId,
        body: discussion.body,
        kind: discussion.kind,
        upvotes: discussion.upvotes,
        mediaUrl: discussion.mediaUrl ?? null,
        mediaType: discussion.mediaType ?? null,
      },
    },
    { status: 201 },
  );
}
