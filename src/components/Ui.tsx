import Link from "next/link";

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border border-amber/40 bg-amber/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-amber ${className}`}
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
          <p className="font-display text-2xl text-cream sm:text-3xl">
            {item.value}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-sand/60">
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
    <span className="text-amber" aria-label={`${rating} out of 5`}>
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)))}
    </span>
  );
}

export function FeedCard({
  type,
  title,
  excerpt,
  meta,
  href,
  votes,
  hot,
  mediaUrl,
  mediaType,
}: {
  type: string;
  title: string;
  excerpt: string;
  meta: string;
  href: string;
  votes?: number;
  hot?: boolean;
  mediaUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | string | null;
}) {
  return (
    <Link
      href={href}
      className="group block border-b border-line py-5 transition hover:bg-sand/40"
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
            {hot && (
              <span className="text-saffron animate-pulse-soft">Trending</span>
            )}
            <span>{type}</span>
            {mediaType ? <span>· {mediaType}</span> : null}
          </div>
          <h3 className="font-display break-words text-lg text-navy transition group-hover:text-amber sm:text-2xl">
            {title}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {excerpt}
          </p>
          {mediaUrl ? (
            <div
              className="mt-3 max-w-md overflow-hidden"
              onClick={(e) => e.preventDefault()}
            >
              {mediaType === "video" ? (
                <video
                  src={mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-56 w-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl}
                  alt=""
                  className="max-h-56 w-full object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          ) : null}
          <p className="mt-3 text-xs text-muted">{meta}</p>
        </div>
        {votes != null && (
          <div className="shrink-0 text-right">
            <p className="font-display text-lg text-navy">
              {votes.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted">
              signal
            </p>
          </div>
        )}
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
