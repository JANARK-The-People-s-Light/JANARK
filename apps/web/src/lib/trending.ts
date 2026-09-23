/**
 * Civic Trend Score for Janark.
 *
 * Trending ≠ most likes. We rank by momentum + constructive civic signals:
 * velocity, acceleration, discussion quality, participant diversity,
 * freshness, and low abuse — not raw popularity.
 */

export type CivicSortMode = "trending" | "momentum" | "hot";

export type EngageKey = { targetType: string; targetId: string };

export type FeedCandidate = {
  _id: unknown;
  type?: string | null;
  refId?: string | null;
  votes?: number | null;
  hot?: boolean | null;
  createdAt?: Date | string | null;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  town?: string | null;
  tags?: string[] | null;
  title?: string | null;
  excerpt?: string | null;
};

export type EngageEvent = {
  targetType: string;
  targetId: string;
  at: Date;
  kind: "upvote" | "downvote" | "comment" | "reply";
  voterOrAuthor?: string | null;
  bodyLen?: number;
  commentScore?: number;
};

export type FlagCount = {
  targetType: string;
  targetId: string;
  count: number;
};

export type CivicBreakdown = {
  score: number;
  velocity: number;
  acceleration: number;
  discussion: number;
  votes: number;
  diversity: number;
  freshness: number;
  trust: number;
};

const WEIGHTS: Record<
  CivicSortMode,
  {
    velocity: number;
    acceleration: number;
    discussion: number;
    votes: number;
    diversity: number;
    freshness: number;
    trust: number;
  }
> = {
  // Fastest-growing civic attention right now
  trending: {
    velocity: 0.3,
    acceleration: 0.15,
    discussion: 0.2,
    votes: 0.1,
    diversity: 0.1,
    freshness: 0.1,
    trust: 0.05,
  },
  // Sustained growth over a longer window
  momentum: {
    velocity: 0.22,
    acceleration: 0.12,
    discussion: 0.25,
    votes: 0.15,
    diversity: 0.15,
    freshness: 0.06,
    trust: 0.05,
  },
  // Active + quality, slightly less spike-sensitive
  hot: {
    velocity: 0.25,
    acceleration: 0.08,
    discussion: 0.22,
    votes: 0.18,
    diversity: 0.1,
    freshness: 0.12,
    trust: 0.05,
  },
};

const EVENT_WEIGHT: Record<EngageEvent["kind"], number> = {
  upvote: 5,
  downvote: 1.5,
  comment: 15,
  reply: 20,
};

function keyOf(t: EngageKey) {
  return `${t.targetType}:${t.targetId}`;
}

/** Map a feed card to all engagement parents that may hold votes/comments */
export function engageTargetsForFeedPost(post: FeedCandidate): EngageKey[] {
  const id = String(post._id);
  const targets: EngageKey[] = [{ targetType: "feed", targetId: id }];
  const ref = post.refId?.trim();
  if (!ref) return targets;

  const type = (post.type || "").toLowerCase();
  const tags = (post.tags || []).map((t) => String(t).toLowerCase());
  const title = (post.title || "").toLowerCase();

  if (type === "meme") targets.push({ targetType: "meme", targetId: ref });
  else if (type === "notice")
    targets.push({ targetType: "notice", targetId: ref });
  else if (type === "issue")
    targets.push({ targetType: "issue", targetId: ref });
  else if (type === "proposal" || type === "vote")
    targets.push({ targetType: "proposal", targetId: ref });
  else if (type === "report")
    targets.push({ targetType: "report", targetId: ref });
  else if (type === "demand")
    targets.push({ targetType: "demand", targetId: ref });
  else if (type === "discussion") {
    if (tags.includes("demand") || title.includes("[demand]")) {
      targets.push({ targetType: "demand", targetId: ref });
    } else if (
      tags.some((t) =>
        ["problem", "crime", "issue", "other", "report"].includes(t),
      ) ||
      /^\[[^\]]+\]/.test(title)
    ) {
      targets.push({ targetType: "report", targetId: ref });
    }
  }

  return targets;
}

function hoursBetween(later: Date, earlier: Date) {
  return Math.max(0, (later.getTime() - earlier.getTime()) / 3_600_000);
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Soft max-normalize with log curve so outliers don't dominate */
function softNorm(value: number, maxInBatch: number) {
  if (maxInBatch <= 0) return 0;
  return clamp01(Math.log1p(Math.max(0, value)) / Math.log1p(maxInBatch));
}

function freshnessScore(ageHours: number, halfLifeHours: number) {
  return Math.exp(-ageHours / Math.max(1, halfLifeHours));
}

function windowWeight(
  events: EngageEvent[],
  now: Date,
  startHoursAgo: number,
  endHoursAgo: number,
) {
  // [startHoursAgo → endHoursAgo] looking backward from now
  // e.g. (6, 0) = last 6 hours; (18, 6) = 6–18 hours ago
  const older = now.getTime() - startHoursAgo * 3_600_000;
  const newer = now.getTime() - endHoursAgo * 3_600_000;
  let w = 0;
  for (const e of events) {
    const t = e.at.getTime();
    if (t >= older && t < newer) w += EVENT_WEIGHT[e.kind];
  }
  const span = Math.max(0.5, startHoursAgo - endHoursAgo);
  return w / span;
}

function scorePostComponents(
  post: FeedCandidate,
  events: EngageEvent[],
  flagCount: number,
  now: Date,
  mode: CivicSortMode,
): Omit<CivicBreakdown, "score"> & { rawVelocity: number } {
  const created = post.createdAt ? new Date(post.createdAt) : now;
  const ageHours = Math.max(0.25, hoursBetween(now, created));

  const halfLife = mode === "momentum" ? 72 : mode === "hot" ? 48 : 36;

  // Velocity windows: recent vs prior (acceleration ≈ d²y/dt² proxy)
  const recentHours = mode === "momentum" ? 24 : 6;
  const priorHours = mode === "momentum" ? 48 : 18;
  const recentRate = windowWeight(events, now, recentHours, 0);
  const priorRate = windowWeight(events, now, priorHours, recentHours);
  const acceleration =
    recentRate / Math.max(0.35, priorRate) - (priorRate > 0.01 ? 0 : 0.25);

  // Discussion quality: replies, length, comment scores — not emoji spam
  let topLevel = 0;
  let replies = 0;
  let bodyChars = 0;
  let commentScoreSum = 0;
  for (const e of events) {
    if (e.kind === "comment") {
      topLevel += 1;
      bodyChars += e.bodyLen ?? 0;
      commentScoreSum += e.commentScore ?? 0;
    } else if (e.kind === "reply") {
      replies += 1;
      bodyChars += e.bodyLen ?? 0;
      commentScoreSum += e.commentScore ?? 0;
    }
  }
  const replyRatio = replies / Math.max(1, topLevel);
  const avgLen = bodyChars / Math.max(1, topLevel + replies);
  const discussionRaw =
    topLevel * 12 +
    replies * 18 +
    Math.min(40, avgLen / 4) +
    Math.max(0, commentScoreSum) * 2 +
    replyRatio * 25;

  // Verified civic votes (net + participation), dampened
  let ups = 0;
  let downs = 0;
  for (const e of events) {
    if (e.kind === "upvote") ups += 1;
    if (e.kind === "downvote") downs += 1;
  }
  const legacyVotes = Math.max(0, post.votes ?? 0);
  const net = ups - downs + legacyVotes * 0.15;
  const voteParticipation = ups + downs;
  const votesRaw =
    Math.max(0, net) * 3 +
    voteParticipation * 1.5 +
    (post.hot ? 8 : 0);

  // Diversity: place tagged + unique participants (cross-citizen signal)
  const participants = new Set<string>();
  for (const e of events) {
    const who = e.voterOrAuthor?.trim();
    if (who) participants.add(who);
  }
  const hasPlace = Boolean(
    post.state || post.district || post.city || post.town,
  );
  const diversityRaw =
    (hasPlace ? 18 : 0) +
    Math.min(40, participants.size * 4) +
    Math.min(12, (post.tags?.length ?? 0) * 2);

  const freshness = freshnessScore(ageHours, halfLife);

  // Low abuse / report rate → trust
  const trust = 1 / (1 + flagCount * 2.2);

  return {
    velocity: recentRate,
    acceleration: Math.max(0, acceleration),
    discussion: discussionRaw,
    votes: votesRaw,
    diversity: diversityRaw,
    freshness,
    trust,
    rawVelocity: recentRate,
  };
}

/**
 * Rank feed candidates with a civic trend score for the given mode.
 * Pass engagement events + flag counts collected for the candidate set.
 */
export function rankByCivicScore(
  posts: FeedCandidate[],
  events: EngageEvent[],
  flags: FlagCount[],
  mode: CivicSortMode,
  now = new Date(),
): { post: FeedCandidate; breakdown: CivicBreakdown }[] {
  const byTarget = new Map<string, EngageEvent[]>();
  for (const e of events) {
    const k = keyOf({ targetType: e.targetType, targetId: e.targetId });
    const list = byTarget.get(k);
    if (list) list.push(e);
    else byTarget.set(k, [e]);
  }

  const flagMap = new Map<string, number>();
  for (const f of flags) {
    flagMap.set(keyOf(f), f.count);
  }

  const w = WEIGHTS[mode];
  const components = posts.map((post) => {
    const targets = engageTargetsForFeedPost(post);
    const merged: EngageEvent[] = [];
    let flagCount = 0;
    for (const t of targets) {
      const k = keyOf(t);
      const ev = byTarget.get(k);
      if (ev) merged.push(...ev);
      flagCount += flagMap.get(k) ?? 0;
    }
    return {
      post,
      ...scorePostComponents(post, merged, flagCount, now, mode),
    };
  });

  const maxV = Math.max(0, ...components.map((c) => c.velocity));
  const maxA = Math.max(0, ...components.map((c) => c.acceleration));
  const maxD = Math.max(0, ...components.map((c) => c.discussion));
  const maxVotes = Math.max(0, ...components.map((c) => c.votes));
  const maxDiv = Math.max(0, ...components.map((c) => c.diversity));

  return components
    .map((c) => {
      const velocity = softNorm(c.velocity, maxV || 1);
      const acceleration = softNorm(c.acceleration, maxA || 1);
      const discussion = softNorm(c.discussion, maxD || 1);
      const votes = softNorm(c.votes, maxVotes || 1);
      const diversity = softNorm(c.diversity, maxDiv || 1);
      const freshness = clamp01(c.freshness);
      const trust = clamp01(c.trust);

      const score =
        (w.velocity * velocity +
          w.acceleration * acceleration +
          w.discussion * discussion +
          w.votes * votes +
          w.diversity * diversity +
          w.freshness * freshness +
          w.trust * trust) *
        // Trust is also a multiplicative gate against abuse farming
        (0.55 + 0.45 * trust);

      return {
        post: c.post,
        breakdown: {
          score,
          velocity,
          acceleration,
          discussion,
          votes,
          diversity,
          freshness,
          trust,
        },
      };
    })
    .sort((a, b) => b.breakdown.score - a.breakdown.score);
}

/** Group target ids by type for efficient Prisma IN queries */
export function groupTargetsByType(posts: FeedCandidate[]) {
  const map = new Map<string, Set<string>>();
  for (const post of posts) {
    for (const t of engageTargetsForFeedPost(post)) {
      const set = map.get(t.targetType) ?? new Set<string>();
      set.add(t.targetId);
      map.set(t.targetType, set);
    }
  }
  return [...map.entries()].map(([targetType, ids]) => ({
    targetType,
    targetIds: [...ids],
  }));
}
