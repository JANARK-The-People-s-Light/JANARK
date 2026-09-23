"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FeedCard } from "@/components/Ui";
import { AdSlot } from "@/components/ads/AdSlot";
import { FeedEngage } from "@/components/FeedEngage";
import { HashtagFilter, InlineTags } from "@/components/HashtagFilter";
import { IconFilter, IconSearch, IconX } from "@/components/Icons";
import { SearchableSelect } from "@/components/SearchableSelect";
import { usePreferences } from "@/components/PreferencesProvider";
import { AD_CONFIG } from "@/config/ads";
import { resolveFeedKind } from "@/lib/feed-kind";
import { portalHref } from "@/lib/paths";

type Post = {
  id: string;
  publicId?: string | null;
  type: string;
  title: string;
  excerpt: string;
  href: string;
  meta: string;
  votes?: number;
  hot?: boolean;
  tags?: string[];
  author?: string;
  createdAt?: string;
  refId?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
};

type Hashtag = { tag: string; count: number };

type Locations = {
  countries: string[];
  states: string[];
  districts: string[];
  cities: string[];
};

const TABS = [
  { value: "all", label: "All" },
  { value: "petition", label: "Petitions" },
  { value: "report", label: "Reports" },
  { value: "proposal", label: "Votes" },
  { value: "discussion", label: "Discussions" },
] as const;

/** Extra types only inside the Filter sheet */
const FILTER_EXTRA = [
  { value: "share", label: "Community posts" },
  { value: "issue", label: "Issues" },
  { value: "notice", label: "Notices" },
] as const;

const FILTER_TYPES = [...TABS, ...FILTER_EXTRA] as const;

const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "momentum", label: "Momentum" },
  { value: "hot", label: "Hot" },
  { value: "new", label: "Newest" },
] as const;

const EMPTY_LOCATIONS: Locations = {
  countries: ["India"],
  states: [],
  districts: [],
  cities: [],
};

function HomeTrendingInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { prefs } = usePreferences();

  const type = searchParams.get("type") || "all";
  const sort = searchParams.get("sort") || prefs.feedSort || "trending";
  const tag = (searchParams.get("tag") || "").replace(/^#/, "");
  const qParam = searchParams.get("q") || "";
  const country = searchParams.get("country") || "";
  const state = searchParams.get("state") || "";
  const district = searchParams.get("district") || "";
  const city = searchParams.get("city") || "";

  const [q, setQ] = useState(qParam);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [locations, setLocations] = useState<Locations>(EMPTY_LOCATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (type && type !== "all") p.set("type", type);
    if (sort && sort !== "trending") p.set("sort", sort);
    if (tag) p.set("tag", tag);
    if (qParam.trim()) p.set("q", qParam.trim());
    if (country) p.set("country", country);
    if (state) p.set("state", state);
    if (district) p.set("district", district);
    if (city) p.set("city", city);
    p.set("limit", "40");
    return p.toString();
  }, [type, sort, tag, qParam, country, state, district, city]);

  const hasFilters =
    Boolean(tag || qParam || country || state || district || city) ||
    type !== "all" ||
    sort !== "trending";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const p = new URLSearchParams(searchParams.toString());
      if (
        !value ||
        (key === "type" && value === "all") ||
        (key === "sort" && value === "trending")
      ) {
        p.delete(key);
      } else {
        p.set(key, value);
      }

      // Cascade clear when parent location changes
      if (key === "country") {
        p.delete("state");
        p.delete("district");
        p.delete("city");
      } else if (key === "state") {
        p.delete("district");
        p.delete("city");
      } else if (key === "district") {
        p.delete("city");
      }

      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/feed?${queryString}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load trending");
      setPosts(data.posts ?? []);
      setHashtags(data.hashtags ?? []);
      setTypeCounts(data.typeCounts ?? {});
      if (data.locations) {
        setLocations({
          countries: data.locations.countries?.length
            ? data.locations.countries
            : EMPTY_LOCATIONS.countries,
          states: data.locations.states ?? [],
          districts: data.locations.districts ?? [],
          cities: data.locations.cities ?? [],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const visiblePosts = useMemo(() => {
    if (prefs.showSharesInFeed || type !== "all") return posts;
    return posts.filter((p) => p.type !== "share");
  }, [posts, prefs.showSharesInFeed, type]);

  /** Tab badge for All — exclude shares when that pref hides them. */
  const allTabCount = useMemo(() => {
    const all = typeCounts.all;
    if (typeof all !== "number") return all;
    if (prefs.showSharesInFeed) return all;
    const shares = typeCounts.share ?? 0;
    return Math.max(0, all - shares);
  }, [typeCounts.all, typeCounts.share, prefs.showSharesInFeed]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setParam("q", q.trim() || null);
  }

  function toggleTag(t: string) {
    setParam("tag", tag === t ? null : t);
  }

  function clearFilters() {
    if (type !== "all") {
      const p = new URLSearchParams();
      p.set("type", type);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
      return;
    }
    router.replace(pathname, { scroll: false });
  }

  useEffect(() => {
    if (!filterOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [filterOpen]);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (city) parts.push(city);
    else if (district) parts.push(district);
    else if (state) parts.push(state);
    else if (country) parts.push(country);
    if (type !== "all") {
      parts.push(
        FILTER_TYPES.find((t) => t.value === type)?.label ?? type,
      );
    }
    if (tag) parts.push(`#${tag}`);
    if (qParam.trim()) parts.push(`“${qParam.trim()}”`);
    if (sort !== "trending") {
      parts.push(SORTS.find((s) => s.value === sort)?.label ?? sort);
    }
    return parts;
  }, [city, district, state, country, type, tag, qParam, sort]);

  const empty = !loading && posts.length === 0;

  const emptyState = useMemo(() => {
    const extraFilters = Boolean(
      tag || qParam || country || state || district || city,
    );
    const byType: Record<
      string,
      { message: string; primary: { href: string; label: string } }
    > = {
      proposal: {
        message: extraFilters
          ? "No votes match these filters yet."
          : "No votes yet. Start one.",
        primary: {
          href: portalHref("/vote/new"),
          label: "Create vote / poll",
        },
      },
      issue: {
        message: extraFilters
          ? "No issues match these filters yet."
          : "No issues yet. Raise one.",
        primary: {
          href: portalHref("/issues/new"),
          label: "Raise an issue",
        },
      },
      report: {
        message: extraFilters
          ? "No reports match these filters yet."
          : "No reports yet. File one.",
        primary: {
          href: portalHref("/reports/new"),
          label: "File a report",
        },
      },
      petition: {
        message: extraFilters
          ? "No petitions match these filters yet."
          : "No petitions yet. Start one.",
        primary: {
          href: portalHref("/petitions/new"),
          label: "Launch petition",
        },
      },
      discussion: {
        message: extraFilters
          ? "No discussions match these filters yet."
          : "No discussions yet. Start one.",
        primary: {
          href: portalHref("/feed/new"),
          label: "Start a discussion",
        },
      },
      notice: {
        message: extraFilters
          ? "No notices match these filters yet."
          : "No notices yet. Post one.",
        primary: {
          href: portalHref("/notice/new"),
          label: "Raise a notice",
        },
      },
      meme: {
        message: extraFilters
          ? "No memes match these filters yet."
          : "No memes yet. Share one.",
        primary: {
          href: portalHref("/memes/new"),
          label: "Post a meme",
        },
      },
      share: {
        message: extraFilters
          ? "No community posts match these filters yet."
          : "No community posts yet. Share something.",
        primary: {
          href: portalHref("/share/new"),
          label: "Share",
        },
      },
    };

    if (type !== "all" && byType[type]) {
      return {
        message: byType[type].message,
        actions: [byType[type].primary],
      };
    }

    return {
      message: hasFilters
        ? "No posts match these filters yet."
        : "Nothing trending yet. Be the first to share.",
      actions: [
        {
          href: portalHref("/share/new"),
          label: "Share",
        },
        {
          href: portalHref("/petitions/new"),
          label: "Start a petition",
        },
      ],
    };
  }, [
    type,
    tag,
    qParam,
    country,
    state,
    district,
    city,
    hasFilters,
  ]);

  const filterPanel = (
    <div className="space-y-5 p-4 sm:p-5">
      <div>
        <p className="mb-2 text-xs font-medium text-navy">Location</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">Country</span>
            <SearchableSelect
              value={country}
              onChange={(v) => setParam("country", v || null)}
              options={locations.countries.map((c) => ({
                value: c,
                label: c,
              }))}
              emptyLabel="All"
              searchPlaceholder="Search country…"
              variant="box"
              aria-label="Country"
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">State</span>
            <SearchableSelect
              value={state}
              onChange={(v) => setParam("state", v || null)}
              options={locations.states.map((s) => ({ value: s, label: s }))}
              emptyLabel="All"
              searchPlaceholder="Search state…"
              variant="box"
              aria-label="State"
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">District</span>
            <SearchableSelect
              value={district}
              onChange={(v) => setParam("district", v || null)}
              options={locations.districts.map((d) => ({
                value: d,
                label: d,
              }))}
              emptyLabel="All"
              searchPlaceholder="Search district…"
              variant="box"
              aria-label="District"
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">City / town</span>
            <SearchableSelect
              value={city}
              onChange={(v) => setParam("city", v || null)}
              options={locations.cities.map((c) => ({ value: c, label: c }))}
              emptyLabel="All"
              searchPlaceholder="Search city…"
              variant="box"
              aria-label="City or town"
            />
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Sort
        </p>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="min-h-11 w-full border border-line bg-white px-3 py-2 text-sm text-navy sm:max-w-xs"
          aria-label="Sort"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        {type === "all" ? (
          <>
            <p className="mb-2 text-xs font-medium text-navy">Type</p>
            <div className="flex flex-wrap gap-2">
              {FILTER_TYPES.map((t) => {
                const count =
                  t.value === "all"
                    ? allTabCount
                    : t.value === "proposal"
                      ? (typeCounts.votes ?? typeCounts.proposal)
                      : typeCounts[t.value];
                const active = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setParam("type", t.value)}
                    className={`min-h-10 px-1.5 py-2 text-sm transition ${
                      active
                        ? "font-medium text-link"
                        : "text-muted hover:text-navy"
                    }`}
                  >
                    {t.label}
                    {typeof count === "number" && count > 0 ? (
                      <span className="ml-1.5 text-[11px] tabular-nums opacity-50">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            Showing{" "}
            <span className="font-medium text-navy">
              {FILTER_TYPES.find((t) => t.value === type)?.label ?? type}
            </span>{" "}
            — switch tabs above to change type. Place and hashtag filters still
            apply.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-navy">Hashtags</p>
        {hashtags.length > 0 ? (
          <HashtagFilter
            tags={hashtags}
            active={tag || undefined}
            onSelect={toggleTag}
            limit={16}
            label=""
          />
        ) : (
          <p className="text-sm text-muted">
            Topics appear as citizens tag posts.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <section className="px-4 py-7 sm:px-8 sm:py-9">
      <AdSlot placement="home-top" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-display text-3xl tracking-tight text-navy sm:text-4xl">
          Community Feed
        </h1>
        <div className="flex items-center gap-2">
          <form
            onSubmit={submitSearch}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-line bg-white sm:min-w-[16rem] sm:flex-none"
          >
            <IconSearch className="ml-3 h-4 w-4 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="min-h-10 min-w-0 flex-1 bg-transparent py-2 pr-2 text-sm outline-none placeholder:text-muted"
              aria-label="Search feed"
            />
            {q ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setParam("q", null);
                }}
                className="px-2.5 text-muted hover:text-navy"
                aria-label="Clear search"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </form>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition ${
              hasFilters
                ? "bg-amber/15 font-medium text-link"
                : "text-muted hover:bg-sand/70 hover:text-navy"
            }`}
            aria-haspopup="dialog"
            aria-expanded={filterOpen}
            aria-label="Open filters and sort"
          >
            <IconFilter className="h-4 w-4" />
            Filter
            {hasFilters ? (
              <span className="tabular-nums text-xs opacity-80">
                {filterSummary.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {filterSummary.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filterSummary.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterOpen(true)}
              className="rounded-md bg-sand/60 px-2 py-1 text-xs text-navy/80 hover:bg-sand"
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => clearFilters()}
            className="inline-flex text-muted hover:text-navy"
            aria-label="Clear filters"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {filterOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-chrome/45 p-0 sm:items-start sm:justify-center sm:p-6 sm:pt-20"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-filter-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFilterOpen(false);
          }}
        >
          <div className="flex max-h-[min(92dvh,100%)] w-full max-w-2xl flex-col overflow-hidden border border-line bg-white shadow-xl sm:max-h-[min(85vh,40rem)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-5">
              <div>
                <p
                  id="home-filter-title"
                  className="text-xs font-semibold uppercase tracking-wider text-navy"
                >
                  Filter
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  Place, sort, type, and topics
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => clearFilters()}
                    className="text-xs text-link hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-muted hover:text-navy"
                  aria-label="Close filters"
                >
                  <IconX />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{filterPanel}</div>
            <div className="shrink-0 border-t border-line bg-cream px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-5">
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="min-h-11 w-full bg-chrome px-4 py-2 text-sm text-on-chrome"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      <div
        className="-mx-4 mt-5 flex gap-1 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:mx-0 sm:mt-6 sm:overflow-visible sm:px-0"
        role="tablist"
        aria-label="Community feed"
      >
        {TABS.map((t) => {
          const active = type === t.value;
          const count =
            t.value === "all"
              ? allTabCount
              : t.value === "proposal"
                ? (typeCounts.votes ?? typeCounts.proposal)
                : typeCounts[t.value];
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setParam("type", t.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-chrome text-on-chrome"
                  : "text-muted hover:bg-sand/70 hover:text-navy"
              }`}
            >
              {t.label}
              {typeof count === "number" && count > 0 ? (
                <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
              ) : null}
            </button>
          );
        })}
        {/* Trailing space so the last tab can scroll fully into view on mobile */}
        <span className="w-6 shrink-0 sm:hidden" aria-hidden />
      </div>

      <div className="mt-2 divide-y divide-line/70">
        {loading && posts.length === 0 && (
          <p className="py-16 text-sm text-muted">Loading feed…</p>
        )}
        {empty && (
          <div className="py-16">
            <p className="text-base text-muted">{emptyState.message}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {emptyState.actions.map((action, i) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    i === 0
                      ? "rounded-full bg-chrome px-5 py-2.5 text-sm text-on-chrome"
                      : "px-2 py-2.5 text-sm text-muted hover:text-navy"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        )}
        {visiblePosts.map((item, index) => (
          <div key={item.id}>
            {index === AD_CONFIG.feedMiddleAfterIndex ? (
              <AdSlot placement="feed-middle" className="border-y border-line/50 py-2" />
            ) : null}
            <article className="min-w-0">
            <FeedCard
              {...item}
              blurMedia={
                prefs.blurSensitiveMedia &&
                resolveFeedKind(item.type, {
                  title: item.title,
                  href: item.href,
                  tags: item.tags,
                }).kind === "report"
              }
            />
            {item.tags && item.tags.length > 0 ? (
              <InlineTags
                className="mt-1 pl-5 sm:pl-6"
                tags={item.tags}
                onSelect={toggleTag}
                limit={4}
              />
            ) : null}
            <div className="mt-3 pl-5 sm:pl-6">
              <FeedEngage post={item} compact />
            </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeTrending() {
  return (
    <Suspense
      fallback={
        <section className="px-4 py-8 sm:px-6">
          <p className="text-sm text-muted">Loading trending…</p>
        </section>
      }
    >
      <HomeTrendingInner />
    </Suspense>
  );
}
