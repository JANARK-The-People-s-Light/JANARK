import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import {
  bumpMongoStats,
  bumpTrend,
  recordActivity,
} from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { publicReport } from "@/lib/phone";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { parseOptionalMedia } from "@/lib/media";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";
import { allocatePublicPostId } from "@/lib/public-id";

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
  "nation",
]);
const TYPES = new Set(["issue", "crime", "problem", "other"]);

function locationLabel(r: {
  locationLevel: string;
  village: string | null;
  town: string | null;
  city: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  country: string;
}) {
  const parts = [
    r.village,
    r.town,
    r.city,
    r.block,
    r.district,
    r.state,
    r.country,
  ].filter(Boolean);
  return parts.join(", ") || r.country;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  let level = searchParams.get("level");
  if (level === "nation") level = "national";
  const state = searchParams.get("state");
  const district = searchParams.get("district");
  const city = searchParams.get("city");
  const town = searchParams.get("town");
  const village = searchParams.get("village");
  const q = searchParams.get("q");

  const reports = await prisma.citizenReport.findMany({
    where: {
      ...(type && TYPES.has(type) ? { type } : {}),
      ...(level && LEVELS.has(level) ? { locationLevel: level } : {}),
      ...(state ? { state: { contains: state } } : {}),
      ...(district ? { district: { contains: district } } : {}),
      ...(city ? { city: { contains: city } } : {}),
      ...(town ? { town: { contains: town } } : {}),
      ...(village ? { village: { contains: village } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { body: { contains: q } },
              { state: { contains: q } },
              { district: { contains: q } },
              { city: { contains: q } },
              { town: { contains: q } },
              { village: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
    take: 80,
    include: {
      reactions: true,
      _count: { select: { reportVotes: true, reactions: true } },
    },
  });

  return NextResponse.json({
    reports: reports.map((r) => {
      const reactionCounts: Record<string, number> = {};
      for (const react of r.reactions) {
        reactionCounts[react.reaction] =
          (reactionCounts[react.reaction] ?? 0) + 1;
      }
      const { reactions: _r, ...rest } = r;
      return {
        ...publicReport(rest),
        locationLabel: locationLabel(r),
        reactionCounts,
        voteCount: r._count.reportVotes,
        reactionTotal: r._count.reactions,
      };
    }),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "report-create",
    body,
    req,
    phoneRequired: true,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);
  const terms = requireCivicPostTerms(body);
  if (!terms.ok) {
    return NextResponse.json({ error: terms.error }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  const type = String(body.type ?? "problem");
  const locationLevel = String(body.locationLevel ?? "village");
  const voterKey = body.voterKey ? String(body.voterKey) : null;
  if (!voterKey) {
    return NextResponse.json(
      { error: "Verify your phone to post" },
      { status: 401 },
    );
  }
  const publicAuthor = await publicAuthorFromVoterKey(voterKey);
  if (!publicAuthor) {
    return NextResponse.json(
      { error: "Verify your phone to post" },
      { status: 401 },
    );
  }

  if (!title || !text) {
    return NextResponse.json(
      { error: "title and description required" },
      { status: 400 },
    );
  }
  if (!TYPES.has(type) || !LEVELS.has(locationLevel)) {
    return NextResponse.json(
      { error: "Invalid type or location level" },
      { status: 400 },
    );
  }

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  const publicId = await allocatePublicPostId();
  const report = await prisma.citizenReport.create({
    data: {
      publicId,
      type,
      title,
      body: text,
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
    },
  });

  const label = locationLabel(report);

  await connectMongo();
  await FeedPost.create({
    type: "discussion",
    title: `[${type}] ${title}`,
    excerpt: text.slice(0, 220),
    body: text,
    publicId,
    href: `/reports/${report.id}`,
    meta: `${label} · ${locationLevel}`,
    votes: 0,
    hot: true,
    tags: [type, locationLevel, report.state ?? "India"].filter(Boolean) as string[],
    refId: report.id,
    author: report.authorLabel,
    authorAnonId: publicAuthor.authorAnonId,
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
    locationLevel,
    village: report.village ?? undefined,
    town: report.town ?? undefined,
    city: report.city ?? undefined,
    district: report.district ?? undefined,
    state: report.state ?? undefined,
    country: report.country,
  });
  await bumpTrend(type, 2, locationLevel);
  if (report.state) await bumpTrend(report.state, 1, "state");
  await bumpMongoStats({ citizens: 1 });
  await recordActivity({
    kind: "issue",
    summary: `${type} reported: ${title} (${label})`,
    href: `/reports/${report.id}`,
  });

  return NextResponse.json(
    {
      report: {
        ...publicReport(report),
        locationLabel: label,
      },
    },
    { status: 201 },
  );
}
