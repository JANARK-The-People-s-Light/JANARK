/** Visual personality for civic feed content types */

export type FeedKind =
  | "vote"
  | "petition"
  | "report"
  | "discussion"
  | "issue"
  | "notice"
  | "share"
  | "other";

export type FeedKindMeta = {
  kind: FeedKind;
  label: string;
  /** Left accent bar */
  bar: string;
  /** Soft pill background */
  pill: string;
  /** Pill text */
  pillText: string;
  metric: "support" | "participants" | "momentum";
};

export function resolveFeedKind(
  type: string,
  opts?: { title?: string; href?: string; tags?: string[] },
): FeedKindMeta {
  const t = (type || "").toLowerCase();
  const title = (opts?.title || "").toLowerCase();
  const href = opts?.href || "";
  const tags = (opts?.tags ?? []).map((x) => x.toLowerCase());

  const isPetition =
    t === "petition" ||
    t === "demand" ||
    tags.includes("petition") ||
    tags.includes("demand") ||
    title.startsWith("[demand]") ||
    title.startsWith("[petition]") ||
    href.includes("/petitions/") ||
    href.includes("/demands/");

  if (isPetition) {
    return {
      kind: "petition",
      label: "Petition",
      bar: "bg-success",
      pill: "bg-success/10",
      pillText: "text-success",
      metric: "support",
    };
  }
  if (t === "proposal" || t === "vote") {
    return {
      kind: "vote",
      label: "Open vote",
      bar: "bg-fact",
      pill: "bg-fact/10",
      pillText: "text-fact",
      metric: "participants",
    };
  }
  if (
    t === "report" ||
    href.includes("/reports/") ||
    /^\[(issue|crime|problem|other)\]/.test(title)
  ) {
    return {
      kind: "report",
      label: "Report",
      bar: "bg-danger",
      pill: "bg-danger/10",
      pillText: "text-danger",
      metric: "support",
    };
  }
  if (t === "issue" || href.includes("/issues/")) {
    return {
      kind: "issue",
      label: "Issue",
      bar: "bg-saffron",
      pill: "bg-saffron/15",
      pillText: "text-saffron",
      metric: "momentum",
    };
  }
  if (t === "notice" || href.includes("/notice/")) {
    return {
      kind: "notice",
      label: "Notice",
      bar: "bg-amber",
      pill: "bg-amber/10",
      pillText: "text-amber",
      metric: "momentum",
    };
  }
  if (
    t === "share" ||
    href.includes("/share/") ||
    tags.includes("share")
  ) {
    return {
      kind: "share",
      label: "Community Post",
      bar: "bg-news",
      pill: "bg-news/10",
      pillText: "text-news",
      metric: "support",
    };
  }
  return {
    kind: "discussion",
    label: "Discussion",
    bar: "bg-navy/35",
    pill: "bg-navy/5",
    pillText: "text-navy/70",
    metric: "support",
  };
}

export function relativeTime(iso?: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const sec = Math.round((Date.now() - t) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function placeLabel(parts: {
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
}): string | null {
  const label = [parts.city, parts.district, parts.state]
    .filter(Boolean)
    .join(", ");
  return label || parts.country || null;
}

export function metricLabel(
  metric: FeedKindMeta["metric"],
  n: number,
): { value: string; label: string } {
  const value = n.toLocaleString("en-IN");
  if (metric === "participants") return { value, label: "participants" };
  if (metric === "momentum") return { value, label: "momentum" };
  return { value, label: n === 1 ? "support" : "supports" };
}
