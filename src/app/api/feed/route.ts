import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import { FeedPost, Trend } from "@/lib/mongo-models";
import { prisma } from "@/lib/db";
import { bumpTrend, recordActivity } from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail, liveJson } from "@/lib/http";
import { normalizeHashtag } from "@/lib/memes";
import {
  groupTargetsByType,
  rankByCivicScore,
  type CivicSortMode,
  type EngageEvent,
  type FeedCandidate,
} from "@/lib/trending";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";
import { parseOptionalMedia } from "@/lib/media";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { allocatePublicPostId, publicPostHref } from "@/lib/public-id";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const TYPES = new Set([
  "discussion",
  "meme",
  "notice",
  "proposal",
  "issue",
  "vote",
  "petition",
  "report",
]);

const CIVIC_SORTS = new Set<CivicSortMode>(["trending", "momentum", "hot"]);

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build Mongo filter fragment for feed type / tab (incl. petition & report). */
function typeFilterClause(typeRaw: string): Record<string, unknown> | null {
  if (!typeRaw || typeRaw === "all" || !TYPES.has(typeRaw)) return null;

  if (typeRaw === "petition") {
    return {
      $or: [
        { tags: { $in: ["petition", "demand"] } },
        { href: { $regex: /\/petitions\//i } },
        { title: { $regex: /^\[demand\]/i } },
      ],
    };
  }
  if (typeRaw === "report") {
    return {
      $or: [
        { href: { $regex: /\/reports\//i } },
        { title: { $regex: /^\[(issue|crime|problem|other)\]/i } },
      ],
    };
  }
  if (typeRaw === "vote" || typeRaw === "proposal") {
    return { type: "proposal" };
  }
  if (typeRaw === "discussion") {
    return {
      type: "discussion",
      href: { $not: { $regex: /\/(petitions|reports)\//i } },
    };
  }
  return { type: typeRaw };
}

function uniqSorted(values: (string | null | undefined)[]) {
  return [
    ...new Set(
      values
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

async function loadCivicEngagement(posts: FeedCandidate[], since: Date) {
  const groups = groupTargetsByType(posts);
  if (groups.length === 0) {
    return { events: [] as EngageEvent[], flags: [] };
  }

  const orClause = groups.map((g) => ({
    targetType: g.targetType,
    targetId: { in: g.targetIds },
  }));

  const [votes, comments, flagRows] = await Promise.all([
    prisma.engagementVote.findMany({
      where: {
        OR: orClause,
        createdAt: { gte: since },
      },
      select: {
        targetType: true,
        targetId: true,
        value: true,
        voterKey: true,
        createdAt: true,
      },
    }),
    prisma.engagementComment.findMany({
      where: {
        OR: orClause,
        createdAt: { gte: since },
      },
      select: {
        targetType: true,
        targetId: true,
        parentId: true,
        authorAnonId: true,
        authorHash: true,
        body: true,
        upvotes: true,
        downvotes: true,
        createdAt: true,
      },
    }),
    prisma.contentFlag.groupBy({
      by: ["targetType", "targetId"],
      where: { OR: orClause },
      _count: { _all: true },
    }),
  ]);

  const events: EngageEvent[] = [];
  for (const v of votes) {
    events.push({
      targetType: v.targetType,
      targetId: v.targetId,
      at: v.createdAt,
      kind: v.value >= 1 ? "upvote" : "downvote",
      voterOrAuthor: v.voterKey,
    });
  }
  for (const c of comments) {
    events.push({
      targetType: c.targetType,
      targetId: c.targetId,
      at: c.createdAt,
      kind: c.parentId ? "reply" : "comment",
      voterOrAuthor: c.authorAnonId || c.authorHash,
      bodyLen: c.body?.length ?? 0,
      commentScore: (c.upvotes ?? 0) - (c.downvotes ?? 0),
    });
  }

  const flags = flagRows.map((f) => ({
    targetType: f.targetType,
    targetId: f.targetId,
    count: f._count._all,
  }));

  return { events, flags };
}

export async function GET(req: Request) {
  await connectMongo();
  const { searchParams } = new URL(req.url);
  const hotFlag = searchParams.get("hot");
  const q = searchParams.get("q")?.trim() ?? "";
  const typeRaw = searchParams.get("type")?.trim().toLowerCase() ?? "all";
  const sort = searchParams.get("sort")?.trim().toLowerCase() ?? "trending";
  const tagRaw = searchParams.get("tag")?.trim() ?? "";
  const tag = tagRaw
    ? normalizeHashtag(tagRaw) || tagRaw.replace(/^#/, "").toLowerCase()
    : "";
  const country = searchParams.get("country")?.trim() ?? "";
  const state = searchParams.get("state")?.trim() ?? "";
  const district = searchParams.get("district")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const town = searchParams.get("town")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 40) || 40, 80);

  const andParts: Record<string, unknown>[] = [];
  if (hotFlag === "1") andParts.push({ hot: true });
  const typeClause = typeFilterClause(typeRaw);
  if (typeClause) andParts.push(typeClause);
  if (tag) {
    andParts.push({
      tags: { $regex: new RegExp(`^#?${escapeRegex(tag)}$`, "i") },
    });
  }
  if (country) {
    andParts.push({
      country: { $regex: new RegExp(`^${escapeRegex(country)}$`, "i") },
    });
  }
  if (state) {
    andParts.push({
      state: { $regex: new RegExp(`^${escapeRegex(state)}$`, "i") },
    });
  }
  if (district) {
    andParts.push({
      district: { $regex: new RegExp(`^${escapeRegex(district)}$`, "i") },
    });
  }
  if (city) {
    andParts.push({
      $or: [
        { city: { $regex: new RegExp(`^${escapeRegex(city)}$`, "i") } },
        { town: { $regex: new RegExp(`^${escapeRegex(city)}$`, "i") } },
      ],
    });
  }
  if (town) {
    andParts.push({
      town: { $regex: new RegExp(`^${escapeRegex(town)}$`, "i") },
    });
  }
  if (q) {
    const safeQ = escapeRegex(q.slice(0, 80));
    andParts.push({
      $or: [
        { title: { $regex: safeQ, $options: "i" } },
        { excerpt: { $regex: safeQ, $options: "i" } },
        { tags: { $regex: safeQ, $options: "i" } },
        { meta: { $regex: safeQ, $options: "i" } },
        { state: { $regex: safeQ, $options: "i" } },
        { city: { $regex: safeQ, $options: "i" } },
        { district: { $regex: safeQ, $options: "i" } },
      ],
    });
  }

  const filter: Record<string, unknown> =
    andParts.length === 0
      ? {}
      : andParts.length === 1
        ? andParts[0]!
        : { $and: andParts };

  const useCivic = CIVIC_SORTS.has(sort as CivicSortMode);
  const candidateLimit = useCivic
    ? Math.min(Math.max(limit * 4, 80), 160)
    : limit;

  // Prefetch recent candidates; civic ranking reorders by momentum + quality.
  const prefetchSort: Record<string, 1 | -1> = { createdAt: -1, votes: -1 };

  const [
    rawPosts,
    typeBuckets,
    tagBuckets,
    prismaTags,
    trends,
    feedStates,
    feedDistricts,
    feedCities,
    feedTowns,
    reportLocs,
    demandLocs,
  ] = await Promise.all([
    FeedPost.find(filter).sort(prefetchSort).limit(candidateLimit).lean(),
    FeedPost.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
    FeedPost.aggregate([
      { $unwind: "$tags" },
      {
        $group: {
          _id: { $toLower: "$tags" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]),
    prisma.hashtag.findMany({
      include: { _count: { select: { memes: true } } },
      orderBy: { memes: { _count: "desc" } },
      take: 30,
    }),
    Trend.find().sort({ score: -1 }).limit(30).lean(),
    FeedPost.distinct("state"),
    state
      ? FeedPost.distinct("district", {
          state: { $regex: new RegExp(`^${escapeRegex(state)}$`, "i") },
        })
      : FeedPost.distinct("district"),
    state
      ? FeedPost.distinct("city", {
          state: { $regex: new RegExp(`^${escapeRegex(state)}$`, "i") },
          ...(district
            ? {
                district: {
                  $regex: new RegExp(`^${escapeRegex(district)}$`, "i"),
                },
              }
            : {}),
        })
      : FeedPost.distinct("city"),
    state
      ? FeedPost.distinct("town", {
          state: { $regex: new RegExp(`^${escapeRegex(state)}$`, "i") },
          ...(district
            ? {
                district: {
                  $regex: new RegExp(`^${escapeRegex(district)}$`, "i"),
                },
              }
            : {}),
        })
      : FeedPost.distinct("town"),
    prisma.citizenReport.findMany({
      select: {
        state: true,
        district: true,
        city: true,
        town: true,
        country: true,
      },
    }),
    prisma.publicDemand.findMany({
      select: { state: true, district: true, city: true, country: true },
    }),
  ]);

  type Ranked = FeedCandidate & {
    href?: string;
    meta?: string;
    author?: string;
    authorAnonId?: string | null;
    publicId?: string | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
    locationLevel?: string | null;
    village?: string | null;
    country?: string | null;
    civicScore?: number;
  };

  let rankedPosts = rawPosts as Ranked[];
  let civicMeta: { mode: CivicSortMode; scored: number } | null = null;

  if (useCivic) {
    const mode = sort as CivicSortMode;
    const since = new Date(Date.now() - 72 * 3_600_000);
    const { events, flags } = await loadCivicEngagement(rankedPosts, since);
    const ranked = rankByCivicScore(rankedPosts, events, flags, mode);
    rankedPosts = ranked.slice(0, limit).map((r) => ({
      ...(r.post as Ranked),
      civicScore: r.breakdown.score,
    }));
    civicMeta = { mode, scored: ranked.length };
  } else if (sort === "new") {
    rankedPosts = [...rankedPosts]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, limit);
  } else {
    rankedPosts = rankedPosts.slice(0, limit);
  }

  const typeCounts: Record<string, number> = { all: 0 };
  for (const b of typeBuckets) {
    const key = String(b._id || "other");
    typeCounts[key] = b.count;
    typeCounts.all += b.count;
  }
  const [petitionCount, reportCount, discussionPlain] = await Promise.all([
    FeedPost.countDocuments(typeFilterClause("petition") ?? {}),
    FeedPost.countDocuments(typeFilterClause("report") ?? {}),
    FeedPost.countDocuments(typeFilterClause("discussion") ?? {}),
  ]);
  typeCounts.petition = petitionCount;
  typeCounts.report = reportCount;
  typeCounts.discussion = discussionPlain;
  typeCounts.votes = typeCounts.proposal ?? 0;

  const hashtagMap = new Map<string, number>();
  for (const t of prismaTags) {
    hashtagMap.set(t.tag, (hashtagMap.get(t.tag) ?? 0) + t._count.memes);
  }
  for (const b of tagBuckets) {
    const raw = String(b._id || "").replace(/^#/, "").toLowerCase();
    if (!raw || raw.length < 2) continue;
    hashtagMap.set(raw, (hashtagMap.get(raw) ?? 0) + b.count);
  }
  for (const t of trends) {
    const term = String(t.term || "").replace(/^#/, "").toLowerCase();
    if (!term || term.includes(" ")) continue;
    if (/^[a-z0-9_]{2,40}$/.test(term)) {
      hashtagMap.set(term, (hashtagMap.get(term) ?? 0) + (t.score || 1));
    }
  }

  const hashtags = [...hashtagMap.entries()]
    .map(([tagName, count]) => ({ tag: tagName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const locRows = [...reportLocs, ...demandLocs];
  const locations = {
    countries: uniqSorted([...locRows.map((r) => r.country), "India"]),
    states: uniqSorted([
      ...(feedStates as string[]),
      ...locRows.map((r) => r.state),
    ]),
    districts: uniqSorted([
      ...(feedDistricts as string[]),
      ...locRows
        .filter((r) => !state || r.state?.toLowerCase() === state.toLowerCase())
        .map((r) => r.district),
    ]),
    cities: uniqSorted([
      ...(feedCities as string[]),
      ...(feedTowns as string[]),
      ...locRows
        .filter((r) => {
          if (state && r.state?.toLowerCase() !== state.toLowerCase())
            return false;
          if (
            district &&
            r.district?.toLowerCase() !== district.toLowerCase()
          )
            return false;
          return true;
        })
        .flatMap((r) => [
          r.city,
          "town" in r ? (r as { town?: string | null }).town : null,
        ]),
    ]),
  };

  return liveJson({
    posts: rankedPosts.map((p) => ({
      id: String(p._id),
      publicId: p.publicId ?? null,
      type: p.type,
      title: p.title,
      excerpt: p.excerpt,
      href: p.href,
      meta: p.meta,
      votes: p.votes,
      hot: p.hot,
      author: p.author,
      authorAnonId: p.authorAnonId ?? null,
      tags: p.tags,
      refId: p.refId ?? null,
      mediaUrl: p.mediaUrl ?? null,
      mediaType: p.mediaType ?? null,
      locationLevel: p.locationLevel ?? null,
      village: p.village ?? null,
      town: p.town ?? null,
      city: p.city ?? null,
      district: p.district ?? null,
      state: p.state ?? null,
      country: p.country ?? null,
      createdAt: p.createdAt,
      civicScore:
        typeof p.civicScore === "number"
          ? Math.round(p.civicScore * 1000) / 1000
          : null,
    })),
    hashtags,
    typeCounts,
    locations,
    sort,
    ranking: civicMeta
      ? {
          model: "civic-trend-v1",
          ...civicMeta,
          note: "Ranks by momentum, discussion quality, diversity, and trust — not raw likes.",
        }
      : { model: "chronological" },
    type: typeRaw,
    tag: tag || null,
    q: q || null,
    country: country || null,
    state: state || null,
    district: district || null,
    city: city || null,
    town: town || null,
  });
}

export async function POST(req: Request) {
  await connectMongo();
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "feed-post",
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

  const title = String(body.title ?? "").trim();
  const excerpt = String(body.excerpt ?? body.body ?? "").trim();
  if (!title || !excerpt) {
    return NextResponse.json(
      { error: "title and excerpt/body required" },
      { status: 400 },
    );
  }

  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  const author = await publicAuthorFromVoterKey(String(body.voterKey ?? ""));
  if (!author) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicId = await allocatePublicPostId();
  const post = await FeedPost.create({
    type: body.type ?? "discussion",
    title,
    excerpt: excerpt.slice(0, 280),
    body: body.body,
    publicId,
    href: publicPostHref(publicId),
    meta: body.meta ?? "Citizen post",
    votes: 0,
    hot: true,
    tags: Array.isArray(body.tags) ? body.tags : ["citizen"],
    author: author.authorLabel,
    authorAnonId: author.authorAnonId,
    refId: body.refId,
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
    locationLevel: str(body.locationLevel),
    village: str(body.village),
    town: str(body.town),
    city: str(body.city),
    district: str(body.district),
    state: str(body.state),
    country: str(body.country) ?? "India",
  });

  await bumpTrend(title.split(" ")[0] || "Feed", 2);
  await recordActivity({
    kind: "discussion",
    summary: `Feed: ${title}`,
    href: post.href,
  });

  return NextResponse.json(
    {
      post: {
        id: String(post._id),
        publicId: post.publicId,
        title: post.title,
        href: post.href,
      },
    },
    { status: 201 },
  );
}

export async function PATCH(req: Request) {
  await connectMongo();
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "feed-boost",
    body,
    req,
    phoneRequired: true,
    limit: 80,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const id = String(body.id ?? "");
  const voterKey = String(body.voterKey ?? "");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // One boost per verified citizen — prevent vote inflation
  const existing = await prisma.engagementVote.findUnique({
    where: {
      targetType_targetId_voterKey: {
        targetType: "feed",
        targetId: id,
        voterKey,
      },
    },
  });
  if (existing) {
    const post = await FeedPost.findById(id).select("votes").lean();
    return NextResponse.json({
      post: { id, votes: post?.votes ?? 0 },
      alreadyVoted: true,
    });
  }

  await prisma.engagementVote.create({
    data: {
      targetType: "feed",
      targetId: id,
      voterKey,
      value: 1,
    },
  });

  const post = await FeedPost.findByIdAndUpdate(
    id,
    { $inc: { votes: 1 } },
    { new: true },
  );
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    post: { id: String(post._id), votes: post.votes },
  });
}
