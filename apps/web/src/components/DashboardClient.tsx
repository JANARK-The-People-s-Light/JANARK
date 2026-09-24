"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HashtagFilter } from "@/components/HashtagFilter";
import { IconFilter, IconSearch, IconX } from "@/components/Icons";
import { SearchableSelect } from "@/components/SearchableSelect";
import { usePreferences } from "@/components/PreferencesProvider";
import { templates } from "@/lib/config";
import { portalHref } from "@/lib/paths";
import {
  portalHrefWithSearch,
  replacePortalHref,
} from "@/lib/portal-href";

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
    createdAt?: string | Date | null;
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
] as const;

const EMPTY_LOCATIONS = {
  countries: ["India"],
  states: [] as string[],
  districts: [] as string[],
  cities: [] as string[],
};

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
  const { prefs } = usePreferences();

  const activityRows = useMemo(() => {
    const rows = data?.activity ?? [];
    if (!prefs.activityChronological) return rows;
    return [...rows].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [data?.activity, prefs.activityChronological]);

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

      replacePortalHref(router, portalHrefWithSearch(pathname, p));
    },
    [pathname, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    setQ("");
    replacePortalHref(
      router,
      portalHrefWithSearch(pathname, new URLSearchParams()),
    );
  }, [pathname, router]);

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
    data.hashtags.length === 0 &&
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
                  ? "font-medium text-link"
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
            Topics appear as citizens tag posts.
          </p>
        )}
      </div>
    </div>
  );

  const stats = data?.stats;
  const pulse = templates.portal();

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
            {pulse.pulseEyebrow}
          </p>
          <h1 className="font-display mt-1 text-3xl tracking-tight text-navy sm:text-4xl">
            {pulse.pulseTitle}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {pulse.pulseIntro}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", q.trim() || null);
            }}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-line bg-white sm:min-w-[16rem] sm:flex-none"
          >
            <IconSearch className="ml-3 h-4 w-4 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="min-h-10 min-w-0 flex-1 bg-transparent py-2 pr-2 text-sm outline-none placeholder:text-muted"
              aria-label={pulse.pulseSearchAria}
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
            aria-label="Open filters"
          >
            <IconFilter className="h-4 w-4" />
            Filter
            {hasFilters ? (
              <span className="tabular-nums text-xs opacity-80">
                {filterSummary.length || ""}
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
            onClick={clearFilters}
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
                    onClick={clearFilters}
                    className="text-xs text-link hover:underline"
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
                ["Current users", stats.citizens],
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
                onClick={clearFilters}
                className="text-link hover:underline"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              No signal yet.{" "}
              <Link href={portalHref("/petitions/new")} className="text-link hover:underline">
                Start a petition
              </Link>{" "}
              or{" "}
              <Link href={portalHref("/reports/new")} className="text-link hover:underline">
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
                          <span className="text-navy group-hover:text-link">
                            {issue.title}
                          </span>
                          <span className="text-muted">
                            {issue.voteCount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden bg-sand">
                          <div
                            className="bar-fill h-full bg-chrome-mid"
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
                          <span className="min-w-0 text-navy group-hover:text-link">
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
                <h2 className="font-display text-2xl text-navy">Top petitions</h2>
                <ul className="mt-6 space-y-4">
                  {data.topDemands.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={portalHref(d.href)}
                        className="flex justify-between gap-3 border-b border-line py-3 text-sm text-navy hover:text-link"
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
                      <p className="text-link">
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
                        className="block py-3 text-sm text-navy hover:text-link"
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

          {data.hashtags.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-navy">Trending topics</h2>
              <ul className="mt-4 max-h-[13.75rem] divide-y divide-line overflow-y-auto overscroll-contain border-y border-line pr-1">
                {data.hashtags.slice(0, 16).map((t) => (
                  <li key={t.tag}>
                    <button
                      type="button"
                      onClick={() => setParam("tag", t.tag)}
                      className="flex h-11 w-full items-center justify-between text-left text-sm text-muted transition hover:text-link"
                    >
                      <span className="truncate pr-2">#{t.tag}</span>
                      <span className="shrink-0 text-[11px] tabular-nums opacity-50">
                        {t.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.activity.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-navy">
                Recent activity
              </h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {activityRows.map((a) => (
                  <li key={a.id} className="py-3">
                    {a.href ? (
                      <Link
                        href={portalHref(a.href)}
                        className="text-sm text-navy hover:text-link"
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
