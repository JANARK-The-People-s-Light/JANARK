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

/** Pure live counts from SQLite + Mongo — zero when databases are empty */
export async function getLiveStats() {
  await connectMongo();
  const [
    issueCount,
    proposalCount,
    voteCount,
    noticeCount,
    commentCount,
    reportCount,
    demandCount,
    demandSupports,
    reportVotes,
    memeVotes,
    memeCount,
    phoneCitizens,
    feedCount,
    discussionCount,
  ] = await Promise.all([
    prisma.issue.count(),
    prisma.proposal.count(),
    prisma.vote.count(),
    prisma.notice.count(),
    prisma.comment.count(),
    prisma.citizenReport.count(),
    prisma.publicDemand.count(),
    prisma.demandSupport.count(),
    prisma.reportVote.count(),
    prisma.memeVote.count(),
    prisma.meme.count(),
    prisma.phoneIdentity.count(),
    FeedPost.countDocuments(),
    Discussion.countDocuments(),
  ]);

  const engagement =
    voteCount +
    demandSupports +
    reportVotes +
    memeVotes +
    commentCount +
    discussionCount;

  return {
    citizens: phoneCitizens,
    activeProposals: proposalCount,
    votes: voteCount + demandSupports + reportVotes + memeVotes,
    notices: noticeCount,
    issues: issueCount,
    reports: reportCount,
    demands: demandCount,
    memes: memeCount,
    discussions: commentCount + discussionCount,
    feedPosts: feedCount,
    engagement,
  };
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

export async function getDashboardData() {
  await connectMongo();
  const [issues, reports, demands, stats, trends, states, activity, feedHot] =
    await Promise.all([
      prisma.issue.findMany({ orderBy: { voteCount: "desc" }, take: 10 }),
      prisma.citizenReport.findMany({
        orderBy: { upvotes: "desc" },
        take: 10,
      }),
      prisma.publicDemand.findMany({
        orderBy: { supportCount: "desc" },
        take: 10,
      }),
      getLiveStats(),
      Trend.find().sort({ score: -1 }).limit(12).lean(),
      StateSignal.find().sort({ voteWeight: -1 }).lean(),
      Activity.find().sort({ createdAt: -1 }).limit(15).lean(),
      FeedPost.find().sort({ votes: -1, createdAt: -1 }).limit(8).lean(),
    ]);

  return {
    stats,
    topIssues: issues.map(mapIssue),
    topReports: reports.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      upvotes: r.upvotes,
      href: `/reports/${r.id}`,
    })),
    topDemands: demands.map((d) => ({
      id: d.id,
      title: d.title,
      supportCount: d.supportCount,
      href: `/demands/${d.id}`,
    })),
    trends: trends.map((t) => ({
      term: t.term,
      score: t.score,
      category: t.category,
    })),
    states: states.map((s) => ({
      state: s.state,
      topIssue: s.topIssue,
      rating: s.rating,
      voteWeight: s.voteWeight,
    })),
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
  };
}

export { Discussion, FeedPost, Trend, StateSignal, Activity, PlatformStats };
