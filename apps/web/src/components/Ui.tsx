import Link from "next/link";
import { FeedMediaPreview } from "@/components/FeedMediaPreview";
import {
  metricLabel,
  placeLabel,
  relativeTime,
  resolveFeedKind,
} from "@/lib/feed-kind";
import { portalHref } from "@/lib/paths";

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border border-amber/40 bg-amber/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-link ${className}`}
    >
      DB · Anonymous
    </span>
  );
}

export function NonBindingLabel({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      Non-binding public opinion — not an official referendum or government poll.
    </p>
  );
}

export function StatStrip({
  citizens,
  proposals,
  votes,
  notices,
}: {
  citizens: number;
  proposals: number;
  votes: number;
  notices?: number;
}) {
  const items = [
    { label: "Citizens", value: citizens.toLocaleString("en-IN") },
    { label: "Active proposals", value: proposals.toLocaleString("en-IN") },
    { label: "Votes cast", value: votes.toLocaleString("en-IN") },
    ...(notices != null
      ? [{ label: "Notices", value: notices.toLocaleString("en-IN") }]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="text-center sm:text-left">
          <p className="font-display text-2xl text-on-chrome sm:text-3xl">
            {item.value}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-on-chrome/60">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;
  return (
    <span className="text-link" aria-label={`${rating} out of 5`}>
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)))}
    </span>
  );
}

export function FeedCard({
  id,
  type,
  title,
  excerpt,
  meta,
  href,
  publicId,
  votes,
  hot,
  mediaUrl,
  mediaType,
  tags,
  createdAt,
  city,
  district,
  state,
  country,
  blurMedia,
}: {
  id?: string;
  type: string;
  title: string;
  excerpt: string;
  meta: string;
  href: string;
  publicId?: string | null;
  votes?: number;
  hot?: boolean;
  mediaUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | string | null;
  tags?: string[];
  createdAt?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  /** Soften media until user reveals (reports / sensitive) */
  blurMedia?: boolean;
}) {
  const cardHref = (() => {
    if (publicId) return `/p/${publicId}`;
    const h = (href || "").trim();
    if (!h || h === "/feed" || h.startsWith("/feed?")) {
      return id ? `/p/${id}` : "/feed";
    }
    return h;
  })();

  const kind = resolveFeedKind(type, { title, href: cardHref, tags });
  const when = relativeTime(createdAt);
  const where = placeLabel({ city, district, state, country });
  const cleanTitle = title.replace(
    /^\[(demand|petition|issue|crime|problem|other|notice)\]\s*/i,
    "",
  );
  const metric =
    votes != null ? metricLabel(kind.metric, votes) : null;

  return (
    <Link
      href={portalHref(cardHref)}
      className="group relative block py-8 transition first:pt-2"
    >
      <span
        className={`absolute left-0 top-8 bottom-8 w-[3px] rounded-full ${kind.bar} opacity-80 transition group-hover:opacity-100`}
        aria-hidden
      />
      <div className="pl-5 sm:pl-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${kind.pill} ${kind.pillText}`}
          >
            {kind.label}
          </span>
          {hot ? (
            <span className="text-[11px] font-medium text-saffron">
              Trending
            </span>
          ) : null}
          {when ? <span className="text-muted">{when}</span> : null}
          {where ? (
            <span className="text-muted">
              <span className="text-navy/25">·</span> {where}
            </span>
          ) : null}
        </div>

        <h3 className="font-display mt-3 max-w-2xl text-[1.35rem] leading-snug tracking-tight text-navy transition group-hover:text-navy-mid sm:text-[1.75rem]">
          {cleanTitle}
        </h3>

        {excerpt?.trim() ? (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted line-clamp-2">
            {excerpt.replace(/^\[(demand|petition)\]\s*/i, "")}
          </p>
        ) : null}

        {mediaUrl ? (
          <FeedMediaPreview
            mediaUrl={mediaUrl}
            mediaType={mediaType}
            blur={Boolean(blurMedia)}
          />
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {metric ? (
            <span className="tabular-nums text-navy">
              <span className="font-semibold">{metric.value}</span>{" "}
              <span className="text-muted">{metric.label}</span>
            </span>
          ) : null}
          {meta && !where ? (
            <span className="text-xs text-muted">{meta}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function KindBadge({ kind }: { kind: "opinion" | "evidence" | "news" }) {
  const styles = {
    opinion: "bg-opinion/10 text-opinion border-opinion/20",
    evidence: "bg-fact/10 text-fact border-fact/20",
    news: "bg-news/10 text-news border-news/20",
  };
  const labels = {
    opinion: "User opinion",
    evidence: "Evidence",
    news: "News",
  };
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[kind]}`}
    >
      {labels[kind]}
    </span>
  );
}
