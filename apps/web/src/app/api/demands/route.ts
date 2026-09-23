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

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const LEVELS = new Set([
  "village",
  "town",
  "city",
  "block",
  "district",
  "state",
  "national",
  "country",
]);

function locationLabel(d: {
  village: string | null;
  town: string | null;
  city: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  country: string;
}) {
  return [d.village, d.town, d.city, d.block, d.district, d.state, d.country]
    .filter(Boolean)
    .join(", ");
}

function publicDemand<T extends { authorHash?: string | null }>(row: T) {
  const { authorHash: _drop, ...rest } = row;
  return rest;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const live = searchParams.get("live") === "1";
  const level = searchParams.get("level");
  const state = searchParams.get("state");
  const district = searchParams.get("district");
  const city = searchParams.get("city");
  const town = searchParams.get("town");
  const q = searchParams.get("q");

  const demands = await prisma.publicDemand.findMany({
    where: {
      ...(live
        ? { status: { in: ["open", "gathering"] } }
        : status
          ? { status }
          : {}),
      ...(level && LEVELS.has(level) ? { locationLevel: level } : {}),
      ...(state ? { state: { contains: state } } : {}),
      ...(district ? { district: { contains: district } } : {}),
      ...(city ? { city: { contains: city } } : {}),
      ...(town ? { town: { contains: town } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { body: { contains: q } },
              { ask: { contains: q } },
              { state: { contains: q } },
              { city: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ supportCount: "desc" }, { createdAt: "desc" }],
    take: 80,
  });

  return NextResponse.json({
    demands: demands.map((d) => ({
      ...publicDemand(d),
      locationLabel: locationLabel(d),
    })),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "demand-create",
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
  const ask = String(body.ask ?? "").trim() || title;
  const text = String(body.body ?? "").trim() || ask;
  const locationLevelRaw = String(body.locationLevel ?? "national");
  const locationLevel =
    locationLevelRaw === "nation" ? "national" : locationLevelRaw;
  const voterKey = body.voterKey ? String(body.voterKey) : null;
  if (!voterKey) {
    return NextResponse.json(
      { error: "Verify your phone to raise a demand" },
      { status: 401 },
    );
  }
  const publicAuthor = await publicAuthorFromVoterKey(voterKey);
  if (!publicAuthor) {
    return NextResponse.json(
      { error: "Verify your phone to raise a demand" },
      { status: 401 },
    );
  }

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  if (!LEVELS.has(locationLevel)) {
    return NextResponse.json({ error: "Invalid location level" }, { status: 400 });
  }

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  const publicId = await allocatePublicPostId();
  const demand = await prisma.publicDemand.create({
    data: {
      publicId,
      title,
      body: text,
      ask,
      target: String(body.target ?? "government"),
      targetDetail: body.targetDetail
        ? String(body.targetDetail).trim()
        : null,
      category: body.category ? String(body.category).trim() : null,
      locationLevel,
      village: body.village ? String(body.village).trim() : null,
      town: body.town ? String(body.town).trim() : null,
      city: body.city ? String(body.city).trim() : null,
      block: body.block ? String(body.block).trim() : null,
      district: body.district ? String(body.district).trim() : null,
      state: body.state ? String(body.state).trim() : null,
      country: String(body.country ?? "India").trim() || "India",
      authorLabel: publicAuthor.authorLabel,
      authorAnonId: publicAuthor.authorAnonId,
      authorHash: voterKey,
      mediaUrl: media.mediaUrl,
      mediaType: media.mediaType,
      supportCount: 0,
      upvotes: 0,
      status: "open",
    },
  });

  const label = locationLabel(demand);
  const topics = collectTopicHashtags({
    hashtags: body.hashtags ?? body.tags,
    texts: [title, text, ask],
  });
  await ensureHashtagCatalog(topics);
  await connectMongo();
  await mirrorFeedCard({
    type: "discussion",
    title: `[demand] ${title}`,
    excerpt: ask.slice(0, 220),
    body: text,
    publicId,
    href: `/petitions/${demand.id}`,
    meta: `${label} · petition`,
    votes: demand.supportCount,
    hot: true,
    tags: buildFeedTags(
      ["petition", "demand", locationLevel, demand.state ?? "India"],
      topics,
    ),
    refId: demand.id,
    author: demand.authorLabel,
    authorAnonId: publicAuthor.authorAnonId,
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
    locationLevel,
    village: demand.village ?? undefined,
    town: demand.town ?? undefined,
    city: demand.city ?? undefined,
    district: demand.district ?? undefined,
    state: demand.state ?? undefined,
    country: demand.country,
  });
  await bumpTopicTrends(topics, 2, "petition");
  await bumpMongoStats({ citizens: 1 });
  await recordActivity({
    kind: "proposal",
    summary: `Petition: ${title}`,
    href: `/petitions/${demand.id}`,
  });

  return NextResponse.json(
    {
      demand: {
        ...publicDemand(demand),
        locationLabel: label,
      },
    },
    { status: 201 },
  );
}
