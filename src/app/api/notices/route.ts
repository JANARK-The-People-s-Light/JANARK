import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import {
  bumpMongoStats,
  bumpTopicTrends,
  recordActivity,
} from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { parseOptionalMedia } from "@/lib/media";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";
import { allocatePublicPostId } from "@/lib/public-id";
import {
  buildFeedTags,
  collectTopicHashtags,
} from "@/lib/hashtags";
import { ensureHashtagCatalog } from "@/lib/ensure-hashtags";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ notices });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "notice-create",
    body,
    req,
    phoneRequired: true,
    limit: 15,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);
  const terms = requireCivicPostTerms(body);
  if (!terms.ok) {
    return NextResponse.json({ error: terms.error }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const target = String(body.target ?? "national").trim();
  const targetDetail = body.targetDetail
    ? String(body.targetDetail).trim()
    : null;
  const signerKey = String(body.voterKey ?? body.signerKey ?? "").trim();
  const publicAuthor = await publicAuthorFromVoterKey(signerKey);
  if (!publicAuthor) {
    return NextResponse.json(
      { error: "Verify your phone to publish" },
      { status: 401 },
    );
  }

  if (!title || !description) {
    return NextResponse.json(
      { error: "title and description required" },
      { status: 400 },
    );
  }

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  const publicId = await allocatePublicPostId();
  const notice = await prisma.notice.create({
    data: {
      publicId,
      title,
      description,
      target,
      targetDetail,
      author: publicAuthor.authorLabel,
      authorAnonId: publicAuthor.authorAnonId,
      mediaUrl: media.mediaUrl,
      mediaType: media.mediaType,
      signatures: 1,
      signatureRecords: signerKey
        ? { create: { signerKey } }
        : undefined,
    },
  });

  const topics = collectTopicHashtags({
    hashtags: body.hashtags ?? body.tags,
    texts: [title, description],
  });
  await ensureHashtagCatalog(topics);
  await connectMongo();
  await FeedPost.create({
    type: "notice",
    title,
    excerpt: description.slice(0, 220),
    publicId,
    href: `/notice/${notice.id}`,
    meta: `${target} · new notice`,
    votes: 1,
    hot: true,
    tags: buildFeedTags([target, "notice"], topics),
    refId: notice.id,
    author: publicAuthor.authorLabel,
    authorAnonId: publicAuthor.authorAnonId,
    body: description,
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
  });
  await bumpTopicTrends(topics, 2, "notice");
  await bumpMongoStats({ notices: 1, citizens: 1 });
  await recordActivity({
    kind: "notice",
    summary: `Notice raised: ${title}`,
    href: `/notice/${notice.id}`,
  });

  return NextResponse.json({ notice }, { status: 201 });
}
