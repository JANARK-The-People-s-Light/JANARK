import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import {
  Activity,
  Discussion,
  FeedPost,
  PlatformStats,
  StateSignal,
  Trend,
} from "@/lib/mongo-models";
import { normalizeHashtag } from "@/lib/memes";

export function mapIssue(row: {
  slug: string;
  title: string;
  category: string;
  summary: string;
  whyItMatters: string;
  currentSituation: string;
  pros: string;
  cons: string;
  sources: string;
  relatedSlugs: string;
  voteCount: number;
  rating: number;
  trendingRank: number | null;
}) {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    whyItMatters: row.whyItMatters,
    currentSituation: row.currentSituation,
    pros: JSON.parse(row.pros) as string[],
    cons: JSON.parse(row.cons) as string[],
    sources: JSON.parse(row.sources) as { label: string; url: string }[],
    relatedSlugs: JSON.parse(row.relatedSlugs) as string[],
    voteCount: row.voteCount,
    rating: row.rating,
    trendingRank: row.trendingRank ?? undefined,
  };
}

export function mapProposal(row: {
  id: string;
  title: string;
  description: string;
  benefits: string;
  argumentsFor: string;
  argumentsAgainst: string;
  voteType: string;
  options: string | null;
  results: string | null;
  totalVotes: number;
  issueSlug: string | null;
}) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    benefits: JSON.parse(row.benefits) as string[],
    argumentsFor: JSON.parse(row.argumentsFor) as string[],
    argumentsAgainst: JSON.parse(row.argumentsAgainst) as string[],
    voteType: row.voteType as "likert" | "checklist" | "preference",
    options: row.options ? (JSON.parse(row.options) as string[]) : undefined,
    // Do not surface stored seed percentages — live tallies come from Vote rows
    results: undefined as Record<string, number> | undefined,
    totalVotes: row.totalVotes,
    issueSlug: row.issueSlug ?? undefined,
  };
}

/** Pure live counts from SQLite + Mongo — includes unified engage reactions */
export async function getLiveStats() {
  await connectMongo();
  const [
    issueCount,
    proposalCount,
    pollVoteCount,
    noticeCount,
    engageCommentCount,
    legacyCommentCount,
    reportCount,
    demandCount,
    memeCount,
    phoneCitizens,
    feedCount,
    discussionCount,
    engageVoteCount,
    engageUpvoteCount,
  ] = await Promise.all([
    prisma.issue.count(),
    prisma.proposal.count(),
    prisma.vote.count(),
    prisma.notice.count(),
    prisma.engagementComment.count(),
    prisma.comment.count(),
    prisma.citizenReport.count(),
    prisma.publicDemand.count(),
    prisma.meme.count(),
    prisma.phoneIdentity.count(),
    FeedPost.countDocuments(),
    Discussion.countDocuments(),
    prisma.engagementVote.count(),
    prisma.engagementVote.count({ where: { value: 1 } }),
  ]);

  // Poll ballots + unified up/down reactions (canonical engage layer)
  const votes = pollVoteCount + engageVoteCount;
  // Threaded comments (UI) + any legacy mongo discussions
  const discussions = engageCommentCount + discussionCount + legacyCommentCount;

  return {
    citizens: phoneCitizens,
    activeProposals: proposalCount,
    votes,
    notices: noticeCount,
    issues: issueCount,
    reports: reportCount,
    demands: demandCount,
    memes: memeCount,
    discussions,
    feedPosts: feedCount,
    engagement: votes + discussions,
    pollVotes: pollVoteCount,
    engageVotes: engageVoteCount,
    engageUpvotes: engageUpvoteCount,
    engageComments: engageCommentCount,
  };
}

/**
 * Live issue metrics from poll votes + unified engage (not frozen seed fields).
 */
export async function computeIssueLiveMetrics(slug: string) {
  const proposals = await prisma.proposal.findMany({
    where: { issueSlug: slug },
    select: { id: true },
  });
  const proposalIds = proposals.map((p) => p.id);

  const [pollVotes, issueEngage, proposalEngage, issueComments, proposalComments] =
    await Promise.all([
      proposalIds.length
        ? prisma.vote.findMany({
            where: { proposalId: { in: proposalIds } },
            select: { choice: true },
          })
        : Promise.resolve([]),
      prisma.engagementVote.findMany({
        where: { targetType: "issue", targetId: slug },
        select: { value: true },
      }),
      proposalIds.length
        ? prisma.engagementVote.findMany({
            where: {
              targetType: "proposal",
              targetId: { in: proposalIds },
            },
            select: { value: true },
          })
        : Promise.resolve([]),
      prisma.engagementComment.count({
        where: { targetType: "issue", targetId: slug },
      }),
      proposalIds.length
        ? prisma.engagementComment.count({
            where: {
              targetType: "proposal",
              targetId: { in: proposalIds },
            },
          })
        : Promise.resolve(0),
    ]);

  const allEngage = [...issueEngage, ...proposalEngage];
  const ups = allEngage.filter((v) => v.value === 1).length;
  const downs = allEngage.filter((v) => v.value === -1).length;
  const comments = issueComments + proposalComments;

  // Likert / preference → star contribution
  let likertSum = 0;
  let likertN = 0;
  for (const v of pollVotes) {
    let parsed: string | string[] = v.choice;
    try {
      parsed = JSON.parse(v.choice) as string | string[];
    } catch {
      parsed = v.choice;
    }
    const choices = Array.isArray(parsed) ? parsed : [parsed];
    for (const c of choices) {
      const score =
        c === "strongly_support"
          ? 5
          : c === "support"
            ? 4
            : c === "neutral"
              ? 3
              : c === "oppose"
                ? 2
                : c === "strongly_oppose"
                  ? 1
                  : 3;
      likertSum += score;
      likertN++;
    }
  }

  const voteCount = pollVotes.length + ups + comments;
  const engageTotal = ups + downs;
  const engageStars =
    engageTotal === 0 ? null : Math.max(1, Math.min(5, (ups / engageTotal) * 5));
  const likertStars = likertN === 0 ? null : likertSum / likertN;

  let rating = 0;
  if (likertStars != null && engageStars != null) {
    rating = Math.round(((likertStars + engageStars) / 2) * 10) / 10;
  } else if (likertStars != null) {
    rating = Math.round(likertStars * 10) / 10;
  } else if (engageStars != null) {
    rating = Math.round(engageStars * 10) / 10;
  } else if (comments > 0) {
    rating = 3; // discussion without votes yet
  }

  return { voteCount, rating, ups, downs, comments, pollVotes: pollVotes.length };
}

/** Persist live issue metrics so list sort stays accurate */
export async function syncIssueLiveMetrics(slug: string) {
  const m = await computeIssueLiveMetrics(slug);
  await prisma.issue.update({
    where: { slug },
    data: { voteCount: m.voteCount, rating: m.rating },
  });
  return m;
}

export async function syncAllIssueLiveMetrics() {
  const issues = await prisma.issue.findMany({
    select: { slug: true },
    orderBy: { updatedAt: "desc" },
  });
  const metrics = await Promise.all(
    issues.map(async (i) => {
      const m = await computeIssueLiveMetrics(i.slug);
      return { slug: i.slug, ...m };
    }),
  );
  metrics.sort((a, b) => b.voteCount - a.voteCount);
  await Promise.all(
    metrics.map((m, idx) =>
      prisma.issue.update({
        where: { slug: m.slug },
        data: {
          voteCount: m.voteCount,
          rating: m.rating,
          trendingRank: idx + 1,
        },
      }),
    ),
  );
  return metrics;
}

export type LiveStateSignal = {
  state: string;
  topIssue: string;
  rating: number;
  voteWeight: number;
};

/**
 * Build state signals from live reports, demands, and feed — not a static collection.
 */
export async function computeLiveStateSignals(): Promise<LiveStateSignal[]> {
  await connectMongo();
  const [reports, demands, feed] = await Promise.all([
    prisma.citizenReport.findMany({
      where: { state: { not: null } },
      select: {
        state: true,
        title: true,
        type: true,
        upvotes: true,
        downvotes: true,
        commentCount: true,
      },
      take: 2000,
    }),
    prisma.publicDemand.findMany({
      where: { state: { not: null } },
      select: {
        state: true,
        title: true,
        category: true,
        supportCount: true,
        upvotes: true,
        downvotes: true,
        commentCount: true,
      },
      take: 2000,
    }),
    FeedPost.find({ state: { $exists: true, $nin: [null, ""] } })
      .select("state title votes type")
      .limit(2000)
      .lean(),
  ]);

  type Acc = {
    weight: number;
    ups: number;
    downs: number;
    topics: Map<string, number>;
  };
  const byState = new Map<string, Acc>();

  function bump(
    state: string | null | undefined,
    topic: string,
    weight: number,
    ups = 0,
    downs = 0,
  ) {
    const key = (state ?? "").trim();
    if (!key) return;
    let acc = byState.get(key);
    if (!acc) {
      acc = { weight: 0, ups: 0, downs: 0, topics: new Map() };
      byState.set(key, acc);
    }
    acc.weight += Math.max(0, weight);
    acc.ups += ups;
    acc.downs += downs;
    const t = topic.trim() || "Civic signal";
    acc.topics.set(t, (acc.topics.get(t) ?? 0) + Math.max(1, weight));
  }

  for (const r of reports) {
    bump(
      r.state,
      r.title,
      1 + r.upvotes + r.commentCount,
      r.upvotes,
      r.downvotes,
    );
  }
  for (const d of demands) {
    bump(
      d.state,
      d.category || d.title,
      1 + d.supportCount + d.upvotes + d.commentCount,
      d.upvotes + d.supportCount,
      d.downvotes,
    );
  }
  for (const f of feed) {
    bump(
      f.state as string | undefined,
      String(f.title || f.type || "Feed"),
      1 + (typeof f.votes === "number" ? f.votes : 0),
      typeof f.votes === "number" ? f.votes : 0,
      0,
    );
  }

  const out: LiveStateSignal[] = [];
  for (const [state, acc] of byState) {
    let topIssue = "Civic activity";
    let topScore = 0;
    for (const [topic, score] of acc.topics) {
      if (score > topScore) {
        topScore = score;
        topIssue = topic.length > 72 ? `${topic.slice(0, 69)}…` : topic;
      }
    }
    const denom = acc.ups + acc.downs;
    const rating =
      acc.weight === 0
        ? 0
        : denom > 0
          ? Math.round(Math.max(1, Math.min(5, (acc.ups / denom) * 5)) * 10) /
            10
          : Math.round(
              Math.max(1, Math.min(5, 1 + Math.log10(acc.weight + 1) * 1.6)) *
                10,
            ) / 10;

    out.push({
      state,
      topIssue,
      rating,
      voteWeight: acc.weight,
    });
  }

  out.sort((a, b) => b.voteWeight - a.voteWeight);
  return out;
}


/** Aggregate real ballots for a proposal into percentages */
export async function getLiveVoteTallies(proposalId: string) {
  const votes = await prisma.vote.findMany({
    where: { proposalId },
    select: { choice: true },
  });
  if (votes.length === 0) {
    return { liveVotes: 0, results: null as Record<string, number> | null };
  }

  const counts: Record<string, number> = {};
  for (const v of votes) {
    let parsed: string | string[] = v.choice;
    try {
      parsed = JSON.parse(v.choice) as string | string[];
    } catch {
      parsed = v.choice;
    }
    if (Array.isArray(parsed)) {
      for (const c of parsed) {
        counts[c] = (counts[c] ?? 0) + 1;
      }
    } else {
      counts[parsed] = (counts[parsed] ?? 0) + 1;
    }
  }

  const totalForPct = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const results: Record<string, number> = {};
  for (const [key, n] of Object.entries(counts)) {
    results[key] = Math.round((n / totalForPct) * 100);
  }

  return { liveVotes: votes.length, results };
}

export async function bumpMongoStats(_partial: {
  citizens?: number;
  votes?: number;
  notices?: number;
  activeProposals?: number;
}) {
  // Stats are derived from real counts — no inflated counter doc
  await connectMongo();
}

export async function recordActivity(input: {
  kind:
    | "vote"
    | "notice"
    | "discussion"
    | "share"
    | "proposal"
    | "issue"
    | "meme";
  summary: string;
  href?: string;
  meta?: Record<string, unknown>;
}) {
  await connectMongo();
  await Activity.create(input);
}

export async function bumpTrend(term: string, by = 1, category?: string) {
  await connectMongo();
  await Trend.findOneAndUpdate(
    { term },
    {
      $inc: { score: by },
      $setOnInsert: { term, category },
    },
    { upsert: true },
  );
}

export async function getDashboardData(filters: DashboardFilters = {}) {
  await connectMongo();

  const tagNorm = filters.tag
    ? normalizeHashtag(filters.tag) ||
      filters.tag.replace(/^#/, "").toLowerCase()
    : "";
  const q = filters.q?.trim() ?? "";
  const kind = filters.kind && filters.kind !== "all" ? filters.kind : "";
  const loc = prismaLocWhere(filters);
  const filtered = hasDashboardFilters(filters);

  const mongoFilter: Record<string, unknown> = {
    ...mongoLocFilter(filters),
  };
  if (tagNorm) {
    mongoFilter.tags = {
      $regex: new RegExp(`^#?${escapeRegex(tagNorm)}$`, "i"),
    };
  }
  if (q) {
    const textClause = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { body: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        { meta: { $regex: q, $options: "i" } },
      ],
    };
    mongoFilter.$and = [textClause];
  }
  if (kind === "issues") mongoFilter.type = "issue";
  else if (kind === "votes") mongoFilter.type = { $in: ["proposal", "vote"] };
  else if (kind === "memes") mongoFilter.type = "meme";
  else if (kind === "reports") mongoFilter.type = "discussion";
  else if (kind === "demands") mongoFilter.type = "discussion";

  const taggedFeed =
    tagNorm || q || kind
      ? await FeedPost.find(mongoFilter)
          .select("refId type")
          .limit(500)
          .lean()
      : [];

  const issueSlugs = new Set<string>();
  const reportOrDemandIds = new Set<string>();
  const proposalIds = new Set<string>();

  for (const p of taggedFeed) {
    const id = p.refId ? String(p.refId) : "";
    if (!id) continue;
    const t = String(p.type || "");
    if (t === "issue") issueSlugs.add(id);
    else if (t === "proposal" || t === "vote") proposalIds.add(id);
    else reportOrDemandIds.add(id);
  }

  if (filters.country || filters.state || filters.district || filters.city) {
    const props = await prisma.proposal.findMany({
      where: loc,
      select: { issueSlug: true, id: true },
      take: 120,
    });
    for (const p of props) {
      proposalIds.add(p.id);
      if (p.issueSlug) issueSlugs.add(p.issueSlug);
    }
  }

  let reportWhere: Record<string, unknown> = { ...loc };
  let demandWhere: Record<string, unknown> = { ...loc };
  let issueWhere: Record<string, unknown> = {};

  if (tagNorm) {
    const ids = [...reportOrDemandIds];
    const slugs = [...issueSlugs];
    reportWhere = ids.length ? { id: { in: ids }, ...loc } : { id: "__none__" };
    demandWhere = ids.length ? { id: { in: ids }, ...loc } : { id: "__none__" };
    issueWhere = slugs.length ? { slug: { in: slugs } } : { slug: "__none__" };
  } else if (q) {
    const ids = [...reportOrDemandIds];
    const slugs = [...issueSlugs];
    reportWhere = {
      AND: [
        loc,
        {
          OR: [
            { title: { contains: q } },
            { body: { contains: q } },
            ...(ids.length ? [{ id: { in: ids } }] : []),
          ],
        },
      ],
    };
    demandWhere = {
      AND: [
        loc,
        {
          OR: [
            { title: { contains: q } },
            { body: { contains: q } },
            { ask: { contains: q } },
            ...(ids.length ? [{ id: { in: ids } }] : []),
          ],
        },
      ],
    };
    issueWhere = {
      OR: [
        { title: { contains: q } },
        { summary: { contains: q } },
        ...(slugs.length ? [{ slug: { in: slugs } }] : []),
      ],
    };
  } else if (Object.keys(loc).length > 0) {
    // Location-only: issues via proposal links; reports/demands by place fields
    const slugs = [...issueSlugs];
    issueWhere = slugs.length ? { slug: { in: slugs } } : { slug: "__none__" };
  }

  if (kind === "reports") {
    demandWhere = { id: "__none__" };
    issueWhere = { slug: "__none__" };
  } else if (kind === "demands") {
    reportWhere = { id: "__none__" };
    issueWhere = { slug: "__none__" };
  } else if (kind === "issues") {
    reportWhere = { id: "__none__" };
    demandWhere = { id: "__none__" };
  } else if (kind === "votes" || kind === "memes") {
    reportWhere = { id: "__none__" };
    demandWhere = { id: "__none__" };
    issueWhere = { slug: "__none__" };
  }

  const showIssues = !kind || kind === "all" || kind === "issues";
  const showReports = !kind || kind === "all" || kind === "reports";
  const showDemands = !kind || kind === "all" || kind === "demands";

  const [
    issues,
    reports,
    demands,
    stats,
    trends,
    stateSignals,
    activity,
    feedHot,
    reportLocs,
    demandLocs,
    feedLocs,
    hashtagsPrisma,
    tagBuckets,
  ] = await Promise.all([
    showIssues
      ? prisma.issue.findMany({
          where: issueWhere,
          orderBy: [{ voteCount: "desc" }, { updatedAt: "desc" }],
          take: 10,
        })
      : Promise.resolve([]),
    showReports
      ? prisma.citizenReport.findMany({
          where: reportWhere,
          orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
          take: 10,
        })
      : Promise.resolve([]),
    showDemands
      ? prisma.publicDemand.findMany({
          where: demandWhere,
          orderBy: [{ supportCount: "desc" }, { createdAt: "desc" }],
          take: 10,
        })
      : Promise.resolve([]),
    getLiveStats(),
    Trend.find(
      tagNorm
        ? {
            term: {
              $regex: new RegExp(`^#?${escapeRegex(tagNorm)}$`, "i"),
            },
          }
        : q
          ? { term: { $regex: q, $options: "i" } }
          : {},
    )
      .sort({ score: -1 })
      .limit(12)
      .lean(),
    computeLiveStateSignals(),
    Activity.find(
      filtered && (q || tagNorm)
        ? { summary: { $regex: q || tagNorm, $options: "i" } }
        : {},
    )
      .sort({ createdAt: -1 })
      .limit(15)
      .lean(),
    FeedPost.find(mongoFilter)
      .sort({ votes: -1, createdAt: -1 })
      .limit(8)
      .lean(),
    prisma.citizenReport.findMany({
      select: {
        country: true,
        state: true,
        district: true,
        city: true,
        town: true,
      },
      take: 500,
    }),
    prisma.publicDemand.findMany({
      select: {
        country: true,
        state: true,
        district: true,
        city: true,
        town: true,
      },
      take: 500,
    }),
    FeedPost.find(mongoLocFilter(filters))
      .select("country state district city town")
      .limit(500)
      .lean(),
    prisma.hashtag.findMany({
      include: { _count: { select: { memes: true } } },
      orderBy: { tag: "asc" },
      take: 40,
    }),
    FeedPost.aggregate([
      { $match: mongoLocFilter(filters) },
      { $unwind: "$tags" },
      {
        $group: {
          _id: { $toLower: "$tags" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 40 },
    ]),
  ]);

  const [reportCount, demandCount, feedCount] = filtered
    ? await Promise.all([
        prisma.citizenReport.count({ where: reportWhere }),
        prisma.publicDemand.count({ where: demandWhere }),
        FeedPost.countDocuments(mongoFilter),
      ])
    : [stats.reports, stats.demands, stats.feedPosts];

  const scopedStats = {
    ...stats,
    issues: filtered ? issues.length : stats.issues,
    reports: reportCount,
    demands: demandCount,
    feedPosts: feedCount,
    label: filtered ? "In this view" : "National",
  };

  const hashtagMap = new Map<string, number>();
  for (const t of hashtagsPrisma) {
    hashtagMap.set(t.tag, (hashtagMap.get(t.tag) ?? 0) + t._count.memes);
  }
  for (const b of tagBuckets) {
    const raw = String(b._id || "")
      .replace(/^#/, "")
      .toLowerCase();
    if (!raw) continue;
    hashtagMap.set(raw, (hashtagMap.get(raw) ?? 0) + b.count);
  }
  for (const t of trends) {
    const term = String(t.term || "")
      .replace(/^#/, "")
      .toLowerCase();
    if (term) {
      hashtagMap.set(term, (hashtagMap.get(term) ?? 0) + (t.score || 1));
    }
  }
  const hashtags = [...hashtagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);

  const countries = uniqSorted([
    ...reportLocs.map((r) => r.country),
    ...demandLocs.map((r) => r.country),
    ...feedLocs.map((r) => r.country as string | undefined),
    "India",
  ]);
  const statesList = uniqSorted([
    ...reportLocs
      .filter((r) => !filters.country || r.country === filters.country)
      .map((r) => r.state),
    ...demandLocs
      .filter((r) => !filters.country || r.country === filters.country)
      .map((r) => r.state),
    ...feedLocs
      .filter(
        (r) =>
          !filters.country ||
          String(r.country || "").toLowerCase() ===
            filters.country.toLowerCase(),
      )
      .map((r) => r.state as string | undefined),
  ]);
  const districts = uniqSorted([
    ...reportLocs
      .filter((r) => !filters.state || r.state === filters.state)
      .map((r) => r.district),
    ...demandLocs
      .filter((r) => !filters.state || r.state === filters.state)
      .map((r) => r.district),
    ...feedLocs
      .filter(
        (r) =>
          !filters.state ||
          String(r.state || "").toLowerCase() === filters.state.toLowerCase(),
      )
      .map((r) => r.district as string | undefined),
  ]);
  const cities = uniqSorted([
    ...reportLocs
      .filter((r) => !filters.district || r.district === filters.district)
      .flatMap((r) => [r.city, r.town]),
    ...demandLocs
      .filter((r) => !filters.district || r.district === filters.district)
      .flatMap((r) => [r.city, r.town]),
    ...feedLocs
      .filter(
        (r) =>
          !filters.district ||
          String(r.district || "").toLowerCase() ===
            filters.district.toLowerCase(),
      )
      .flatMap((r) => [
        r.city as string | undefined,
        r.town as string | undefined,
      ]),
  ]);

  const liveIssues = await Promise.all(
    issues.map(async (row) => {
      const m = await computeIssueLiveMetrics(row.slug);
      return mapIssue({
        ...row,
        voteCount: m.voteCount,
        rating: m.rating,
      });
    }),
  );
  liveIssues.sort((a, b) => b.voteCount - a.voteCount);

  let liveStates = stateSignals;
  if (filters.state) {
    liveStates = liveStates.filter(
      (s) => s.state.toLowerCase() === filters.state!.toLowerCase(),
    );
  } else if (filters.country && filters.country.toLowerCase() !== "india") {
    // country filter without state — keep all computed states (India-scoped data)
  }

  return {
    stats: scopedStats,
    filtersApplied: filtered,
    topIssues: liveIssues,
    topReports: reports.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      upvotes: r.upvotes,
      href: `/reports/${r.id}`,
      place: [r.city || r.town, r.district, r.state].filter(Boolean).join(", "),
    })),
    topDemands: demands.map((d) => ({
      id: d.id,
      title: d.title,
      supportCount: d.supportCount,
      href: `/demands/${d.id}`,
      place: [d.city || d.town, d.district, d.state].filter(Boolean).join(", "),
    })),
    trends: trends.map((t) => ({
      term: t.term,
      score: t.score,
      category: t.category,
    })),
    states: liveStates,
    activity: activity.map((a) => ({
      id: String(a._id),
      kind: a.kind,
      summary: a.summary,
      href: a.href,
      createdAt: a.createdAt,
    })),
    hotFeed: feedHot.map((f) => ({
      id: String(f._id),
      type: f.type,
      title: f.title,
      excerpt: f.excerpt,
      href: f.href,
      votes: f.votes,
      meta: f.meta,
      hot: f.hot,
    })),
    hashtags,
    locations: {
      countries,
      states: statesList,
      districts,
      cities,
    },
  };
}

export type DashboardFilters = {
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  tag?: string;
  q?: string;
  /** all | issues | reports | demands | votes | memes */
  kind?: string;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasDashboardFilters(f: DashboardFilters) {
  return Boolean(
    f.country ||
      f.state ||
      f.district ||
      f.city ||
      f.tag ||
      f.q?.trim() ||
      (f.kind && f.kind !== "all"),
  );
}

function prismaLocWhere(f: DashboardFilters) {
  const where: Record<string, string> = {};
  if (f.country) where.country = f.country;
  if (f.state) where.state = f.state;
  if (f.district) where.district = f.district;
  if (f.city) where.city = f.city;
  return where;
}

function mongoLocFilter(f: DashboardFilters): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (f.country) {
    filter.country = { $regex: new RegExp(`^${escapeRegex(f.country)}$`, "i") };
  }
  if (f.state) {
    filter.state = { $regex: new RegExp(`^${escapeRegex(f.state)}$`, "i") };
  }
  if (f.district) {
    filter.district = {
      $regex: new RegExp(`^${escapeRegex(f.district)}$`, "i"),
    };
  }
  if (f.city) {
    filter.$or = [
      { city: { $regex: new RegExp(`^${escapeRegex(f.city)}$`, "i") } },
      { town: { $regex: new RegExp(`^${escapeRegex(f.city)}$`, "i") } },
    ];
  }
  return filter;
}

function uniqSorted(vals: (string | null | undefined)[]) {
  return [...new Set(vals.map((v) => (v ?? "").trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export { Discussion, FeedPost, Trend, StateSignal, Activity, PlatformStats };
