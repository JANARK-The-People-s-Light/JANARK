"use client";

type Tag = { tag: string; count?: number };

type FilterProps = {
  tags: Tag[];
  active?: string;
  onSelect: (tag: string) => void;
  /** Max tags shown in the row */
  limit?: number;
  label?: string;
  className?: string;
};

/**
 * Filter hashtags as a single calm scroll row — avoids wrap clouds.
 */
export function HashtagFilter({
  tags,
  active,
  onSelect,
  limit = 12,
  label = "Topics",
  className = "",
}: FilterProps) {
  const list = tags.slice(0, limit);
  if (list.length === 0) return null;

  return (
    <div className={className}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
          {active ? (
            <button
              type="button"
              onClick={() => onSelect(active)}
              className="text-xs text-amber hover:underline"
            >
              Clear #{active}
            </button>
          ) : null}
        </div>
      ) : active ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => onSelect(active)}
            className="text-xs text-amber hover:underline"
          >
            Clear #{active}
          </button>
        </div>
      ) : null}
      <div
        className={`${label ? "mt-3" : ""} -mx-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        <ul className="flex w-max flex-wrap items-center gap-2 sm:flex-wrap">
          {list.map((h) => {
            const isOn = active === h.tag;
            return (
              <li key={h.tag}>
                <button
                  type="button"
                  onClick={() => onSelect(h.tag)}
                  className={`shrink-0 px-1.5 py-1 text-sm transition ${
                    isOn
                      ? "font-medium text-amber"
                      : "text-muted hover:text-navy"
                  }`}
                >
                  #{h.tag}
                  {typeof h.count === "number" && h.count > 0 ? (
                    <span className="ml-1 text-[11px] tabular-nums opacity-50">
                      {h.count}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

type InlineProps = {
  tags: string[];
  onSelect?: (tag: string) => void;
  limit?: number;
  className?: string;
};

/**
 * Sparse inline tags on a card — text links, not a chip wall.
 */
export function InlineTags({
  tags,
  onSelect,
  limit = 4,
  className = "",
}: InlineProps) {
  const clean = tags
    .map((t) => t.replace(/^#/, "").toLowerCase())
    .filter(Boolean);
  const shown = clean.slice(0, limit);
  if (shown.length === 0) return null;
  const extra = clean.length - shown.length;

  return (
    <p className={`text-sm leading-relaxed text-muted ${className}`}>
      {shown.map((t, i) => (
        <span key={t}>
          {i > 0 ? <span className="mx-1.5 text-muted/40">·</span> : null}
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(t)}
              className="text-amber hover:underline"
            >
              #{t}
            </button>
          ) : (
            <span className="text-amber">#{t}</span>
          )}
        </span>
      ))}
      {extra > 0 ? (
        <span className="ml-1.5 text-xs opacity-60">+{extra}</span>
      ) : null}
    </p>
  );
}
