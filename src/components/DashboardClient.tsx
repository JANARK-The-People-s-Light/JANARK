"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HashtagFilter } from "@/components/HashtagFilter";
import { IconFilter, IconSearch, IconX } from "@/components/Icons";
import { portalHref } from "@/lib/paths";

type Stats = {
  citizens: number;
  activeProposals: number;
  votes: number;
  notices: number;
  issues?: number;
  reports?: number;
  demands?: number;
  feedPosts?: number;
  label?: string;
};

type DashboardPayload = {
  stats: Stats;
  filtersApplied?: boolean;
  topIssues: { slug: string; title: string; voteCount: number }[];
  topReports: {
    id: string;
    title: string;
    upvotes: number;
    href: string;
    place?: string;
  }[];
  topDemands: {
    id: string;
    title: string;
    supportCount: number;
    href: string;
    place?: string;
  }[];
  trends: { term: string; score: number }[];
  states: { state: string; topIssue: string; rating: number }[];
  activity: {
    id: string;
    kind: string;
    summary: string;
    href?: string | null;
  }[];
  hotFeed: {
    id: string;
    type: string;
    title: string;
    href: string;
    votes: number;
    meta?: string;
  }[];
  hashtags: { tag: string; count: number }[];
  locations: {
    countries: string[];
    states: string[];
    districts: string[];
    cities: string[];
  };
};

const KINDS = [
  { value: "all", label: "Everything" },
  { value: "issues", label: "Issues" },
  { value: "reports", label: "Reports" },
  { value: "demands", label: "Demands" },
  { value: "votes", label: "Votes" },
  { value: "memes", label: "Memes" },
] as const;

const EMPTY_LOCATIONS = {
  countries: ["India"],
  states: [] as string[],
  districts: [] as string[],
  cities: [] as string[],
};

const selectClass =
  "min-h-10 w-full border border-line bg-white px-2 py-2 text-sm text-navy";

function DashboardInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const kind = searchParams.get("kind") || "all";
  const tag = (searchParams.get("tag") || "").replace(/^#/, "");
  const qParam = searchParams.get("q") || "";
  const country = searchParams.get("country") || "";
  const state = searchParams.get("state") || "";
  const district = searchParams.get("district") || "";
  const city = searchParams.get("city") || "";

  const [q, setQ] = useState(qParam);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [locations, setLocations] = useState(EMPTY_LOCATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (kind && kind !== "all") p.set("kind", kind);
    if (tag) p.set("tag", tag);
    if (qParam.trim()) p.set("q", qParam.trim());
    if (country) p.set("country", country);
    if (state) p.set("state", state);
    if (district) p.set("district", district);
    if (city) p.set("city", city);
    return p.toString();
  }, [kind, tag, qParam, country, state, district, city]);

  const hasFilters =
    Boolean(tag || qParam || country || state || district || city) ||
    kind !== "all";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const p = new URLSearchParams(searchParams.toString());
      if (!value || (key === "kind" && value === "all")) p.delete(key);
      else p.set(key, value);

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
      const res = await fetch(`/api/dashboard?${queryString}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as DashboardPayload;
      if (!res.ok) throw new Error("Could not load dashboard");
      setData(json);
      if (json.locations) {
        setLocations({
          countries: json.locations.countries?.length
            ? json.locations.countries
            : EMPTY_LOCATIONS.countries,
          states: json.locations.states ?? [],
          districts: json.locations.districts ?? [],
          cities: json.locations.cities ?? [],
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
    if (kind !== "all") {
      parts.push(KINDS.find((k) => k.value === kind)?.label ?? kind);
    }
    if (tag) parts.push(`#${tag}`);
    if (qParam.trim()) parts.push(`“${qParam.trim()}”`);
    return parts;
  }, [city, district, state, country, kind, tag, qParam]);

  const maxVotes = Math.max(
    data?.topIssues[0]?.voteCount ?? 0,
    data?.topReports[0]?.upvotes ?? 0,
    data?.topDemands[0]?.supportCount ?? 0,
    1,
  );

  const empty =
    !loading &&
    data &&
    data.topIssues.length === 0 &&
    data.topReports.length === 0 &&
    data.topDemands.length === 0 &&
    data.trends.length === 0 &&
    data.activity.length === 0 &&
    data.states.length === 0 &&
    data.hotFeed.length === 0;

  const filterPanel = (
    <div className="space-y-5 p-4 sm:p-5">
      <div>
        <p className="mb-2 text-xs font-medium text-navy">What to include</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setParam("kind", k.value)}
              className={`min-h-10 px-1.5 py-2 text-sm transition ${
                kind === k.value
                  ? "font-medium text-amber"
                  : "text-muted hover:text-navy"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <p className="mb-2 text-xs font-medium text-navy">Location</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="min-w-0">
            <span className="mb-1 block text-[11px] text-muted">Country</span>
            <select
              value={country}
              onChange={(e) => setParam("country", e.target.value || null)}
              className={selectClass}
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
              className={selectClass}
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
              className={selectClass}
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
              className={selectClass}
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
          e.preventDefault();
          setParam("q", q.trim() || null);
          setFilterOpen(false);
        }}
        className="border-t border-line pt-5"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titles, places, topics…"
            className="w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
        </label>
        <button
          type="submit"
          className="mt-3 inline-flex min-h-11 items-center gap-2 bg-navy px-5 py-2 text-sm text-cream"
        >
          <IconSearch />
          Apply
        </button>
      </form>

      <div className="border-t border-line pt-5">
        <p className="mb-2 text-xs font-medium text-navy">Hashtags</p>
        {(data?.hashtags?.length ?? 0) > 0 ? (
          <HashtagFilter
            tags={data!.hashtags}
            active={tag || undefined}
            onSelect={(t) => setParam("tag", tag === t ? null : t)}
            limit={20}
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

  const stats = data?.stats;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        National signal
      </p>
      <h1 className="font-display mt-1 text-3xl text-navy sm:text-4xl">
        National signal
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        What citizens are elevating right now. Filter by place, topic, or type.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-sm p-1.5 text-sm transition ${
            hasFilters ? "text-amber" : "text-navy/70 hover:text-navy"
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
        {filterSummary.slice(0, 4).map((s) => (
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
          aria-labelledby="dashboard-filter-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFilterOpen(false);
          }}
        >
          <div className="flex max-h-[min(92dvh,100%)] w-full max-w-2xl flex-col overflow-hidden border border-line bg-white shadow-xl sm:max-h-[min(85vh,40rem)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-5">
              <div>
                <p
                  id="dashboard-filter-title"
                  className="text-xs font-semibold uppercase tracking-wider text-navy"
                >
                  Filter signal
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  Location, type, hashtags, and search
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
                  className="inline-flex min-h-10 min-w-10 items-center justify-center text-muted hover:text-navy"
                  aria-label="Close filters"
                >
                  <IconX />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{filterPanel}</div>
          </div>
        </div>
      )}

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}
      {loading && !data && (
        <p className="mt-10 text-sm text-muted">Loading signal…</p>
      )}

      {stats && (
        <div className="mt-8 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-4">
          {(hasFilters
            ? [
                ["Issues", stats.issues ?? 0],
                ["Reports", stats.reports ?? 0],
                ["Demands", stats.demands ?? 0],
                ["Feed", stats.feedPosts ?? 0],
              ]
            : [
                ["Citizens", stats.citizens],
                ["Proposals", stats.activeProposals],
                ["Votes", stats.votes],
                ["Notices", stats.notices],
              ]
          ).map(([label, value]) => (
            <div key={String(label)}>
              <p className="font-display text-2xl text-navy sm:text-3xl">
                {Number(value).toLocaleString("en-IN")}
              </p>
              <p className="text-xs uppercase tracking-wider text-muted">
                {label}
                {hasFilters ? (
                  <span className="ml-1 normal-case tracking-normal opacity-60">
                    · filtered
                  </span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      )}

      {empty ? (
        <p className="mt-12 text-muted">
          {hasFilters ? (
            <>
              No signal matches these filters.{" "}
              <button
                type="button"
                onClick={() => router.replace(pathname, { scroll: false })}
                className="text-amber hover:underline"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              No signal yet.{" "}
              <Link href={portalHref("/demands/new")} className="text-amber hover:underline">
                Raise a demand
              </Link>{" "}
              or{" "}
              <Link href={portalHref("/reports/new")} className="text-amber hover:underline">
                report a problem
              </Link>
              .
            </>
          )}
        </p>
      ) : data ? (
        <>
          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            {data.topIssues.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">Top issues</h2>
                <ul className="mt-6 space-y-4">
                  {data.topIssues.map((issue, i) => (
                    <li key={issue.slug}>
                      <Link
                        href={portalHref(`/issues/${issue.slug}`)}
                        className="group block"
                      >
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-navy group-hover:text-amber">
                            {issue.title}
                          </span>
                          <span className="text-muted">
                            {issue.voteCount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden bg-sand">
                          <div
                            className="bar-fill h-full bg-navy-mid"
                            style={{
                              width: `${(issue.voteCount / maxVotes) * 100}%`,
                              animationDelay: `${i * 0.06}s`,
                            }}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.topReports.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">Top reports</h2>
                <ul className="mt-6 space-y-4">
                  {data.topReports.map((r, i) => (
                    <li key={r.id}>
                      <Link href={portalHref(r.href)} className="group block">
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span className="min-w-0 text-navy group-hover:text-amber">
                            {r.title}
                            {r.place ? (
                              <span className="mt-0.5 block text-xs text-muted">
                                {r.place}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-muted">{r.upvotes}</span>
                        </div>
                        <div className="h-3 overflow-hidden bg-sand">
                          <div
                            className="bar-fill h-full bg-amber"
                            style={{
                              width: `${(r.upvotes / maxVotes) * 100}%`,
                              animationDelay: `${i * 0.06}s`,
                            }}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.topDemands.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">Top demands</h2>
                <ul className="mt-6 space-y-4">
                  {data.topDemands.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={portalHref(d.href)}
                        className="flex justify-between gap-3 border-b border-line py-3 text-sm text-navy hover:text-amber"
                      >
                        <span className="min-w-0">
                          {d.title}
                          {d.place ? (
                            <span className="mt-0.5 block text-xs text-muted">
                              {d.place}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-muted">
                          {d.supportCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.states.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">
                  State signals
                </h2>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {data.states.map((s) => (
                    <li
                      key={s.state}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div>
                        <p className="font-medium text-navy">{s.state}</p>
                        <p className="text-sm text-muted">{s.topIssue}</p>
                      </div>
                      <p className="text-amber">
                        {"★".repeat(Math.round(s.rating))}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.hotFeed.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-navy">Hot in feed</h2>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {data.hotFeed.map((f) => (
                    <li key={f.id}>
                      <Link
                        href={portalHref(f.href)}
                        className="block py-3 text-sm text-navy hover:text-amber"
                      >
                        <span className="text-xs uppercase tracking-wider text-muted">
                          {f.type}
                        </span>{" "}
                        — {f.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {data.trends.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-navy">Live trends</h2>
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                {data.trends.map((t) => {
                  const clean = t.term.replace(/^#/, "");
                  return (
                    <button
                      key={t.term}
                      type="button"
                      onClick={() => setParam("tag", clean)}
                      className="py-1 text-sm text-muted transition hover:text-amber"
                    >
                      {t.term.startsWith("#") ? t.term : `#${clean}`}{" "}
                      <span className="text-[11px] tabular-nums opacity-50">
                        {t.score}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {data.hashtags.length > 0 && !hasFilters && (
            <section className="mt-10">
              <HashtagFilter
                tags={data.hashtags}
                active={tag || undefined}
                onSelect={(t) => setParam("tag", tag === t ? null : t)}
                limit={16}
                label="Topics"
              />
            </section>
          )}

          {data.activity.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-navy">
                Recent activity
              </h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {data.activity.map((a) => (
                  <li key={a.id} className="py-3">
                    {a.href ? (
                      <Link
                        href={portalHref(a.href)}
                        className="text-sm text-navy hover:text-amber"
                      >
                        <span className="text-xs uppercase tracking-wider text-muted">
                          {a.kind}
                        </span>{" "}
                        — {a.summary}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">{a.summary}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

export function DashboardClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted sm:px-6">
          Loading signal…
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
