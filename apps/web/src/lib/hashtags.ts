/** Shared hashtag normalize / parse / extract. */

/** Taxonomy & location labels stored on FeedPost — not citizen topic tags. */
const SYSTEM_TAGS = new Set(
  [
    "discussion",
    "petition",
    "demand",
    "report",
    "notice",
    "vote",
    "proposal",
    "meme",
    "issue",
    "citizen",
    "national",
    "state",
    "city",
    "district",
    "village",
    "town",
    "block",
    "ward",
    "india",
    "problem",
    "grievance",
    "corruption",
    "suggestion",
    "praise",
    "emergency",
    "government",
    "private",
    "media",
    "other",
    "open",
    "closed",
  ].map((t) => t.toLowerCase()),
);

export function normalizeHashtag(raw: string): string | null {
  const t = raw
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (t.length < 2 || t.length > 40) return null;
  return t;
}

export function isSystemTag(raw: string): boolean {
  const n = normalizeHashtag(raw) ?? raw.replace(/^#/, "").toLowerCase();
  return SYSTEM_TAGS.has(n);
}

/**
 * Rejects junk for Live trends / right rail:
 * "Petition", "Open discussion", "national", single letters, etc.
 */
export function isNoiseTrendTerm(raw: string): boolean {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return true;
  // Prose phrases from old bumpTrend("Open discussion") calls
  if (/\s/.test(trimmed)) return true;
  const n = normalizeHashtag(trimmed);
  if (!n || n.length < 3) return true;
  if (isSystemTag(n)) return true;
  // Common non-topic bumps
  const noise = new Set([
    "feed",
    "vote",
    "share",
    "chat",
    "post",
    "stories",
    "network",
    "copy",
    "native",
    "institution",
  ]);
  if (noise.has(n)) return true;
  return false;
}

/** Keep citizen topic tags only (for chips, clouds, InlineTags). */
export function topicTagsOnly(tags: Iterable<string> | null | undefined): string[] {
  if (!tags) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const n = normalizeHashtag(String(raw));
    if (!n || isSystemTag(n) || seen.has(n)) continue;
    // Trends UI prefers 3+ chars; still allow 2-char as stored tags
    seen.add(n);
    out.push(n);
  }
  return out;
}

export function parseHashtags(input: unknown, max = 12): string[] {
  const parts: string[] = [];
  if (Array.isArray(input)) {
    for (const p of input) parts.push(String(p));
  } else if (typeof input === "string") {
    parts.push(...input.split(/[\s,]+/).filter(Boolean));
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const n = normalizeHashtag(p);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out.slice(0, max);
}

/** Pull #tags from free text (caption / body / title). */
export function extractHashtagsFromText(
  text: string | null | undefined,
  max = 12,
): string[] {
  if (!text) return [];
  const re = /#([a-zA-Z][a-zA-Z0-9_]{1,39})\b/g;
  const out: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = normalizeHashtag(m[1]!);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
      if (out.length >= max) break;
    }
  }
  return out;
}

export function mergeHashtags(lists: string[][], max = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const raw of list) {
      const n = normalizeHashtag(raw);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
      if (out.length >= max) return out;
    }
  }
  return out;
}

/**
 * Topic hashtags from dedicated field + inline #tags in text fields.
 */
export function collectTopicHashtags(opts: {
  hashtags?: unknown;
  texts?: (string | null | undefined)[];
  max?: number;
}): string[] {
  const max = opts.max ?? 12;
  const fromField = parseHashtags(opts.hashtags, max);
  const fromText = (opts.texts ?? []).flatMap((t) =>
    extractHashtagsFromText(t, max),
  );
  return mergeHashtags([fromField, fromText], max);
}

/** FeedPost.tags = system meta + citizen topics (deduped). */
export function buildFeedTags(
  system: (string | null | undefined)[],
  topics: string[],
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...system, ...topics]) {
    if (raw == null) continue;
    const s = String(raw).trim().toLowerCase();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}
