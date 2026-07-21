"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FeedCard } from "@/components/Ui";
import { FeedEngage } from "@/components/FeedEngage";
import { HashtagFilter, InlineTags } from "@/components/HashtagFilter";
import { IconFilter, IconSearch, IconX } from "@/components/Icons";
import { portalHref } from "@/lib/paths";

type Post = {
  id: string;
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

const TYPES = [
  { value: "all", label: "All" },
  { value: "discussion", label: "Discussions" },
  { value: "meme", label: "Memes" },
  { value: "notice", label: "Notices" },
  { value: "issue", label: "Issues" },
  { value: "proposal", label: "Votes" },
] as const;

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

  const type = searchParams.get("type") || "all";
  const sort = searchParams.get("sort") || "trending";
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

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setParam("q", q.trim() || null);
  }

  function toggleTag(t: string) {
    setParam("tag", tag === t ? null : t);
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
      parts.push(TYPES.find((t) => t.value === type)?.label ?? type);
    }
    if (tag) parts.push(`#${tag}`);
    if (qParam.trim()) parts.push(`“${qParam.trim()}”`);
    if (sort !== "trending") {
      parts.push(SORTS.find((s) => s.value === sort)?.label ?? sort);
    }
    return parts;
  }, [city, district, state, country, type, tag, qParam, sort]);

  const empty = !loading && posts.length === 0;

  const filterPanel = (
    <div className="space-y-5 p-4 sm:p-5">
      <div>
        <p className="mb-2 text-xs font-medium text-navy">Location</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">Country</span>
            <select
              value={country}
              onChange={(e) => setParam("country", e.target.value || null)}
              className="min-h-10 w-full border border-line bg-white px-2 py-2 text-sm text-navy"
            >
              <option value="">All</option>
              {locations.countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">State</span>
            <select
              value={state}
              onChange={(e) => setParam("state", e.target.value || null)}
              className="min-h-10 w-full border border-line bg-white px-2 py-2 text-sm text-navy"
            >
              <option value="">All</option>
              {locations.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">District</span>
            <select
              value={district}
              onChange={(e) => setParam("district", e.target.value || null)}
              className="min-h-10 w-full border border-line bg-white px-2 py-2 text-sm text-navy"
            >
              <option value="">All</option>
              {locations.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">City / town</span>
            <select
              value={city}
              onChange={(e) => setParam("city", e.target.value || null)}
              className="min-h-10 w-full border border-line bg-white px-2 py-2 text-sm text-navy"
            >
              <option value="">All</option>
              {locations.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          submitSearch(e);
          setFilterOpen(false);
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs text-muted">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titles, tags, places…"
            className="w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
        </label>
        <label className="sm:w-40">
          <span className="mb-1.5 block text-xs text-muted">Sort</span>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="min-h-11 w-full border border-line bg-white px-3 py-2 text-sm text-navy"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-navy px-5 py-2 text-sm text-cream sm:w-auto"
              aria-label="Search"
            >
              <IconSearch />
              <span>Search</span>
            </button>
          </div>
      </form>

      <div>
        <p className="mb-2 text-xs font-medium text-navy">Type</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => {
            const count =
              t.value === "all"
                ? typeCounts.all
                : typeCounts[t.value === "proposal" ? "proposal" : t.value];
            const active = type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setParam("type", t.value)}
                className={`min-h-10 px-1.5 py-2 text-sm transition ${
                  active
                    ? "font-medium text-amber"
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
            Topics appear as citizens tag posts and memes.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Live square
          </p>
          <h2 className="font-display mt-1 text-2xl text-navy sm:text-3xl">
            Trending now
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Ranked by civic momentum — open Filter for place, type, and
            hashtags.
          </p>
        </div>
        <Link
          href={portalHref("/feed")}
          className="shrink-0 text-sm font-medium text-amber hover:underline"
        >
          Full feed →
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-sm p-1.5 text-sm transition ${
            hasFilters
              ? "text-amber"
              : "text-navy/70 hover:text-navy"
          }`}
          aria-haspopup="dialog"
          aria-expanded={filterOpen}
          aria-label="Open filters"
          title="Filter"
        >
          <IconFilter className="h-5 w-5" />
          {hasFilters ? (
            <span className="text-xs tabular-nums text-navy">
              {filterSummary.length || ""}
            </span>
          ) : null}
        </button>
        {filterSummary.slice(0, 3).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterOpen(true)}
            className="max-w-[10rem] truncate px-1.5 py-1 text-xs text-muted underline-offset-2 hover:text-navy hover:underline"
          >
            {s}
          </button>
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="inline-flex items-center justify-center rounded-sm p-1.5 text-navy/60 hover:text-navy"
            aria-label="Clear filters"
            title="Clear filters"
          >
            <IconX />
          </button>
        )}
      </div>

      {filterOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/45 p-0 sm:items-start sm:justify-center sm:p-6 sm:pt-20"
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
                  Location, type, and hashtags
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() =>
                      router.replace(pathname, { scroll: false })
                    }
                    className="text-xs text-amber hover:underline"
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
            <div className="border-t border-line bg-cream px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="min-h-11 w-full bg-navy px-4 py-2 text-sm text-cream"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      <div className="mt-8 border-t border-line">
        {loading && posts.length === 0 && (
          <p className="py-10 text-sm text-muted">Loading trending…</p>
        )}
        {empty && (
          <div className="py-10">
            <p className="text-sm text-muted">
              {hasFilters
                ? "No posts match these filters yet."
                : "Nothing trending yet. Be the first to post."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={portalHref("/demands/new")}
                className="bg-navy px-4 py-2 text-sm text-cream"
              >
                Raise a demand
              </Link>
              <Link
                href={portalHref("/memes/new")}
                className="px-1 py-2 text-sm text-muted hover:text-navy"
              >
                Post a meme
              </Link>
              <Link
                href={portalHref("/feed")}
                className="px-1 py-2 text-sm text-muted hover:text-navy"
              >
                Start a discussion
              </Link>
            </div>
          </div>
        )}
        {posts.map((item) => (
          <div key={item.id} className="border-b border-line py-6">
            <FeedCard {...item} />
            {item.tags && item.tags.length > 0 ? (
              <InlineTags
                className="mt-3"
                tags={item.tags}
                onSelect={toggleTag}
                limit={4}
              />
            ) : null}
            <div className="mt-4">
              <FeedEngage post={item} compact />
            </div>
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
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-sm text-muted">Loading trending…</p>
        </section>
      }
    >
      <HomeTrendingInner />
    </Suspense>
  );
}
