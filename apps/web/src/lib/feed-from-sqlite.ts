import { prisma } from "@/lib/db";
import { topicTagsOnly } from "@/lib/hashtags";
import type { FeedCandidate } from "@/lib/trending";
import { mirrorFeedCard } from "@/lib/services";

export type SqliteFeedCard = FeedCandidate & {
  href: string;
  meta: string;
  author: string;
  authorAnonId: string | null;
  publicId: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  locationLevel: string | null;
  village: string | null;
  country: string | null;
  body?: string | null;
};

type LoadOpts = {
  limit: number;
  typeRaw?: string;
  q?: string;
  tag?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  town?: string;
  /** When true, also write cards into Mongo (best-effort). */
  backfillMongo?: boolean;
};

function matchesQ(
  haystacks: Array<string | null | undefined>,
  q: string,
): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  return haystacks.some((h) => h?.toLowerCase().includes(n));
}

function matchesTag(tags: string[], tag: string): boolean {
  if (!tag) return true;
  const n = tag.toLowerCase().replace(/^#/, "");
  return tags.some((t) => t.toLowerCase().replace(/^#/, "") === n);
}

function matchesLoc(
  row: {
    country?: string | null;
    state?: string | null;
    district?: string | null;
    city?: string | null;
    town?: string | null;
  },
  opts: LoadOpts,
): boolean {
  if (
    opts.country &&
    row.country?.toLowerCase() !== opts.country.toLowerCase()
  ) {
    return false;
  }
  if (opts.state && row.state?.toLowerCase() !== opts.state.toLowerCase()) {
    return false;
  }
  if (
    opts.district &&
    row.district?.toLowerCase() !== opts.district.toLowerCase()
  ) {
    return false;
  }
  if (opts.city) {
    const c = opts.city.toLowerCase();
    if (row.city?.toLowerCase() !== c && row.town?.toLowerCase() !== c) {
      return false;
    }
  }
  if (opts.town && row.town?.toLowerCase() !== opts.town.toLowerCase()) {
    return false;
  }
  return true;
}

function wantType(typeRaw: string | undefined, kind: string): boolean {
  const t = (typeRaw || "all").toLowerCase();
  if (!t || t === "all") return true;
  if (t === "petition") return kind === "petition";
  if (t === "report") return kind === "report";
  if (t === "vote" || t === "proposal") return kind === "proposal";
  if (t === "discussion") return kind === "discussion";
  return kind === t;
}

/**
 * Project civic SQLite rows into FeedPost-shaped cards when Mongo mirror is empty.
 * Aligns with mirrorFeedCard payloads used on create routes.
 */
export async function loadFeedFromSqlite(
  opts: LoadOpts,
): Promise<SqliteFeedCard[]> {
  const take = Math.min(Math.max(opts.limit, 1), 160);
  const q = opts.q?.trim() ?? "";
  const tag = opts.tag?.trim() ?? "";
  const typeRaw = opts.typeRaw ?? "all";

  const [issues, demands, reports, proposals, notices, shares, memes] =
    await Promise.all([
      wantType(typeRaw, "issue")
        ? prisma.issue.findMany({ orderBy: { createdAt: "desc" }, take })
        : Promise.resolve([]),
      wantType(typeRaw, "petition")
        ? prisma.publicDemand.findMany({ orderBy: { createdAt: "desc" }, take })
        : Promise.resolve([]),
      wantType(typeRaw, "report")
        ? prisma.citizenReport.findMany({ orderBy: { createdAt: "desc" }, take })
        : Promise.resolve([]),
      wantType(typeRaw, "proposal")
        ? prisma.proposal.findMany({ orderBy: { createdAt: "desc" }, take })
        : Promise.resolve([]),
      wantType(typeRaw, "notice")
        ? prisma.notice.findMany({ orderBy: { createdAt: "desc" }, take })
        : Promise.resolve([]),
      wantType(typeRaw, "share")
        ? prisma.communityShare.findMany({
            orderBy: { createdAt: "desc" },
            take,
          })
        : Promise.resolve([]),
      wantType(typeRaw, "meme")
        ? prisma.meme.findMany({
            orderBy: { createdAt: "desc" },
            take,
            include: { tags: { include: { hashtag: true } } },
          })
        : Promise.resolve([]),
    ]);

  const cards: SqliteFeedCard[] = [];

  for (const issue of issues) {
    const tags = topicTagsOnly([issue.category]);
    if (!matchesTag(tags, tag)) continue;
    if (!matchesQ([issue.title, issue.summary, issue.category], q)) continue;
    cards.push({
      _id: `sqlite:issue:${issue.id}`,
      type: "issue",
      title: issue.title,
      excerpt: issue.summary.slice(0, 220),
      publicId: issue.publicId,
      href: `/issues/${issue.slug}`,
      meta: `${issue.category} · sqlite`,
      votes: issue.voteCount,
      hot: Boolean(issue.trendingRank),
      tags,
      refId: issue.slug,
      author: "Citizen",
      authorAnonId: null,
      mediaUrl: issue.mediaUrl,
      mediaType: issue.mediaType,
      locationLevel: null,
      village: null,
      country: null,
      createdAt: issue.createdAt,
    });
  }

  for (const demand of demands) {
    if (!matchesLoc(demand, opts)) continue;
    const tags = topicTagsOnly([
      "petition",
      "demand",
      demand.locationLevel,
      demand.state ?? "India",
      demand.category ?? "",
    ]);
    if (!matchesTag(tags, tag)) continue;
    if (!matchesQ([demand.title, demand.ask, demand.body], q)) continue;
    cards.push({
      _id: `sqlite:demand:${demand.id}`,
      type: "discussion",
      title: `[demand] ${demand.title}`,
      excerpt: demand.ask.slice(0, 220),
      body: demand.body,
      publicId: demand.publicId,
      href: `/petitions/${demand.id}`,
      meta: `${demand.category ?? "petition"} · petition`,
      votes: demand.supportCount,
      hot: true,
      tags,
      refId: demand.id,
      author: demand.authorLabel,
      authorAnonId: demand.authorAnonId,
      mediaUrl: demand.mediaUrl,
      mediaType: demand.mediaType,
      locationLevel: demand.locationLevel,
      village: demand.village,
      town: demand.town,
      city: demand.city,
      district: demand.district,
      state: demand.state,
      country: demand.country,
      createdAt: demand.createdAt,
    });
  }

  for (const report of reports) {
    if (!matchesLoc(report, opts)) continue;
    const tags = topicTagsOnly([
      report.type,
      report.locationLevel,
      report.state ?? "India",
    ]);
    if (!matchesTag(tags, tag)) continue;
    if (!matchesQ([report.title, report.body, report.type], q)) continue;
    cards.push({
      _id: `sqlite:report:${report.id}`,
      type: "discussion",
      title: `[${report.type}] ${report.title}`,
      excerpt: report.body.slice(0, 220),
      body: report.body,
      publicId: report.publicId,
      href: `/reports/${report.id}`,
      meta: `${report.type} · ${report.locationLevel}`,
      votes: report.upvotes,
      hot: true,
      tags,
      refId: report.id,
      author: report.authorLabel,
      authorAnonId: report.authorAnonId,
      mediaUrl: report.mediaUrl,
      mediaType: report.mediaType,
      locationLevel: report.locationLevel,
      village: report.village,
      town: report.town,
      city: report.city,
      district: report.district,
      state: report.state,
      country: report.country,
      createdAt: report.createdAt,
    });
  }

  for (const proposal of proposals) {
    if (!matchesLoc(proposal, opts)) continue;
    const tags = topicTagsOnly(["vote"]);
    if (!matchesTag(tags, tag)) continue;
    if (!matchesQ([proposal.title, proposal.description], q)) continue;
    cards.push({
      _id: `sqlite:proposal:${proposal.id}`,
      type: "proposal",
      title: proposal.title,
      excerpt: proposal.description.slice(0, 200),
      publicId: proposal.publicId,
      href: `/vote/${proposal.id}`,
      meta: "Open vote",
      votes: proposal.totalVotes,
      hot: true,
      tags,
      refId: proposal.id,
      author: "Citizen",
      authorAnonId: null,
      mediaUrl: proposal.mediaUrl,
      mediaType: proposal.mediaType,
      locationLevel: proposal.locationLevel,
      village: null,
      town: proposal.town,
      city: proposal.city,
      district: proposal.district,
      state: proposal.state,
      country: proposal.country,
      createdAt: proposal.createdAt,
    });
  }

  for (const notice of notices) {
    const tags = topicTagsOnly([notice.target, "notice"]);
    if (!matchesTag(tags, tag)) continue;
    if (!matchesQ([notice.title, notice.description, notice.target], q)) {
      continue;
    }
    cards.push({
      _id: `sqlite:notice:${notice.id}`,
      type: "notice",
      title: notice.title,
      excerpt: notice.description.slice(0, 220),
      body: notice.description,
      publicId: notice.publicId,
      href: `/notice/${notice.id}`,
      meta: `${notice.target} · notice`,
      votes: 1,
      hot: true,
      tags,
      refId: notice.id,
      author: notice.author ?? "Citizen",
      authorAnonId: notice.authorAnonId ?? null,
      mediaUrl: notice.mediaUrl,
      mediaType: notice.mediaType,
      locationLevel: null,
      village: null,
      country: null,
      createdAt: notice.createdAt,
    });
  }

  for (const share of shares) {
    if (!matchesLoc(share, opts)) continue;
    const tags = topicTagsOnly(["share", "community"]);
    if (!matchesTag(tags, tag)) continue;
    if (!matchesQ([share.caption, share.locationLabel], q)) continue;
    const title =
      share.caption.trim().slice(0, 80) || "Community share";
    cards.push({
      _id: `sqlite:share:${share.id}`,
      type: "share",
      title,
      excerpt: share.caption.slice(0, 220),
      body: share.caption,
      publicId: share.publicId,
      href: `/share/${share.id}`,
      meta: share.locationLabel
        ? `${share.locationLabel} · share`
        : "Community share",
      votes: share.upvotes,
      hot: true,
      tags,
      refId: share.id,
      author: share.authorLabel,
      authorAnonId: share.authorAnonId,
      mediaUrl: share.mediaUrl,
      mediaType: share.mediaType,
      locationLevel: null,
      village: null,
      town: null,
      city: share.city,
      district: share.district,
      state: share.state,
      country: share.country,
      createdAt: share.createdAt,
    });
  }

  for (const meme of memes) {
    const tagList = meme.tags.map((t) => t.hashtag.tag);
    const tags = topicTagsOnly(["meme", ...tagList]);
    if (!matchesTag(tags, tag)) continue;
    if (!matchesQ([meme.title, meme.caption, ...tagList], q)) continue;
    cards.push({
      _id: `sqlite:meme:${meme.id}`,
      type: "meme",
      title: meme.title,
      excerpt:
        meme.caption?.slice(0, 220) ||
        (tagList.length ? `#${tagList.slice(0, 3).join(" #")}` : "Meme"),
      body: meme.caption,
      publicId: meme.publicId,
      href: `/memes/${meme.id}`,
      meta: tagList.map((t) => `#${t}`).join(" "),
      votes: 0,
      hot: true,
      tags,
      refId: meme.id,
      author: meme.authorLabel,
      authorAnonId: meme.authorAnonId,
      mediaUrl: meme.imageUrl,
      mediaType: meme.mediaType,
      locationLevel: null,
      village: null,
      country: null,
      createdAt: meme.createdAt,
    });
  }

  cards.sort((a, b) => {
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    return tb - ta;
  });

  const sliced = cards.slice(0, take);

  if (opts.backfillMongo && sliced.length > 0) {
    void Promise.all(
      sliced.map((c) =>
        mirrorFeedCard({
          type: (c.type as "discussion") || "discussion",
          title: c.title || "",
          excerpt: c.excerpt || "",
          body: c.body ?? undefined,
          publicId: c.publicId ?? undefined,
          href: c.href,
          meta: c.meta,
          votes: c.votes ?? 0,
          hot: Boolean(c.hot),
          tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
          refId: c.refId ?? undefined,
          author: c.author,
          authorAnonId: c.authorAnonId ?? undefined,
          mediaUrl: c.mediaUrl ?? undefined,
          mediaType: (c.mediaType as "image" | "gif" | "video") || undefined,
          locationLevel: c.locationLevel ?? undefined,
          village: c.village ?? undefined,
          town: c.town ?? undefined,
          city: c.city ?? undefined,
          district: c.district ?? undefined,
          state: c.state ?? undefined,
          country: c.country ?? undefined,
        }),
      ),
    ).catch(() => null);
  }

  return sliced;
}

export async function sqliteFeedTypeCounts(): Promise<Record<string, number>> {
  const [issue, demand, report, proposal, notice, share, meme] =
    await Promise.all([
      prisma.issue.count(),
      prisma.publicDemand.count(),
      prisma.citizenReport.count(),
      prisma.proposal.count(),
      prisma.notice.count(),
      prisma.communityShare.count(),
      prisma.meme.count(),
    ]);
  return {
    all: issue + demand + report + proposal + notice + share + meme,
    issue,
    petition: demand,
    report,
    discussion: 0,
    proposal,
    vote: proposal,
    notice,
    share,
    meme,
  };
}
