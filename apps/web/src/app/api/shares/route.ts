import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import {
  bumpMongoStats,
  bumpTopicTrends,
  recordActivity,
  mirrorFeedCard,
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
import { resolvePlace } from "@/lib/report-detect";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function publicShare<T extends { authorHash?: string | null }>(row: T) {
  const { authorHash: _drop, ...rest } = row;
  return rest;
}

function titleFromCaption(caption: string) {
  const line = caption.split(/\n/)[0]?.trim() || caption.trim();
  return line.slice(0, 120) || "Community share";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const shares = await prisma.communityShare.findMany({
    where: q
      ? {
          OR: [
            { caption: { contains: q } },
            { locationLabel: { contains: q } },
            { city: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return NextResponse.json({
    shares: shares.map((s) => publicShare(s)),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "share-create",
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

  const voterKey = body.voterKey ? String(body.voterKey) : null;
  if (!voterKey) {
    return NextResponse.json(
      { error: "Verify your phone to share" },
      { status: 401 },
    );
  }
  const publicAuthor = await publicAuthorFromVoterKey(voterKey);
  if (!publicAuthor) {
    return NextResponse.json(
      { error: "Verify your phone to share" },
      { status: 401 },
    );
  }

  const caption = String(body.caption ?? "").trim();
  if (!caption) {
    return NextResponse.json({ error: "caption required" }, { status: 400 });
  }

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }
  if (!media.mediaUrl) {
    return NextResponse.json(
      { error: "Add a photo or video to share" },
      { status: 400 },
    );
  }

  const locationLabel =
    typeof body.locationLabel === "string" && body.locationLabel.trim()
      ? body.locationLabel.trim()
      : null;
  const place = locationLabel ? resolvePlace(locationLabel) : null;

  const publicId = await allocatePublicPostId();
  const share = await prisma.communityShare.create({
    data: {
      publicId,
      caption,
      mediaUrl: media.mediaUrl,
      mediaType: media.mediaType,
      locationLabel: locationLabel || place?.label || null,
      city:
        (body.city ? String(body.city).trim() : null) ||
        place?.city ||
        null,
      district:
        (body.district ? String(body.district).trim() : null) ||
        place?.district ||
        null,
      state:
        (body.state ? String(body.state).trim() : null) || place?.state || null,
      country:
        (body.country ? String(body.country).trim() : null) ||
        place?.country ||
        "India",
      issueSlug:
        typeof body.issueSlug === "string" && body.issueSlug.trim()
          ? body.issueSlug.trim()
          : null,
      petitionId:
        typeof body.petitionId === "string" && body.petitionId.trim()
          ? body.petitionId.trim()
          : null,
      authorLabel: publicAuthor.authorLabel,
      authorAnonId: publicAuthor.authorAnonId,
      authorHash: voterKey,
    },
  });

  const topics = collectTopicHashtags({
    hashtags: body.hashtags ?? body.tags,
    texts: [caption],
  });
  await ensureHashtagCatalog(topics);
  await connectMongo();

  const title = titleFromCaption(caption);
  await mirrorFeedCard({
    type: "share",
    title,
    excerpt: caption.slice(0, 220),
    body: caption,
    publicId,
    href: `/share/${share.id}`,
    meta: share.locationLabel
      ? `${share.locationLabel} · share`
      : "Community share",
    votes: 0,
    hot: true,
    tags: buildFeedTags(["share", "community"], topics),
    refId: share.id,
    author: share.authorLabel,
    authorAnonId: publicAuthor.authorAnonId,
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
    locationLevel: place?.locationLevel,
    city: share.city ?? undefined,
    district: share.district ?? undefined,
    state: share.state ?? undefined,
    country: share.country ?? undefined,
  });
  await bumpTopicTrends(topics, 2, "share");
  await bumpMongoStats({ citizens: 1 });
  await recordActivity({
    kind: "discussion",
    summary: `Shared: ${title}`,
    href: `/share/${share.id}`,
  });

  return NextResponse.json(
    { share: publicShare(share) },
    { status: 201 },
  );
}
