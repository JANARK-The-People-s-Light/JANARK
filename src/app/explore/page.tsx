"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IconFilter, IconSearch, IconX } from "@/components/Icons";

type Facets = {
  countries: string[];
  states: string[];
  districts: string[];
  cities: string[];
  towns: string[];
  villages: string[];
};

type Item = {
  kind: string;
  id: string;
  title: string;
  excerpt: string;
  href: string;
  locationLabel: string;
  locationLevel: string;
  upvotes: number;
  meta: string;
};

const KINDS = [
  { value: "all", label: "Everything" },
  { value: "demands", label: "Demands" },
  { value: "problems", label: "Problems" },
  { value: "issues", label: "Issues" },
  { value: "votes", label: "Votes" },
  { value: "crime", label: "Crimes" },
];

const LEVELS = [
  { value: "", label: "Any level" },
  { value: "nation", label: "Nation" },
  { value: "state", label: "State" },
  { value: "district", label: "District" },
  { value: "city", label: "City" },
  { value: "town", label: "Town" },
  { value: "village", label: "Village" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const selectClass =
  "w-full border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-amber";

export default function ExplorePage() {
  const [kind, setKind] = useState("all");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [town, setTown] = useState("");
  const [village, setVillage] = useState("");
  const [q, setQ] = useState("");
  const [facets, setFacets] = useState<Facets>({
    countries: ["India"],
    states: [],
    districts: [],
    cities: [],
    towns: [],
    villages: [],
  });
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState({
    problems: 0,
    issues: 0,
    votes: 0,
    demands: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (kind) p.set("kind", kind);
    if (level) p.set("level", level);
    if (country) p.set("country", country);
    if (state) p.set("state", state);
    if (district) p.set("district", district);
    if (city) p.set("city", city);
    if (town) p.set("town", town);
    if (village) p.set("village", village);
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [kind, level, country, state, district, city, town, village, q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/explore?${queryString}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setFacets(data.facets ?? facets);
      setItems(data.items ?? []);
      setCounts(data.counts ?? counts);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  useEffect(() => {
    load();
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

  function clearLocal() {
    setState("");
    setDistrict("");
    setCity("");
    setTown("");
    setVillage("");
    setLevel("");
  }

  function clearAll() {
    setKind("all");
    setCountry("India");
    setQ("");
    clearLocal();
  }

  const hasFilters =
    kind !== "all" ||
    Boolean(level || state || district || city || town || village || q.trim()) ||
    (country && country !== "India");

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (kind !== "all") {
      parts.push(KINDS.find((k) => k.value === kind)?.label ?? kind);
    }
    if (village) parts.push(village);
    else if (town) parts.push(town);
    else if (city) parts.push(city);
    else if (district) parts.push(district);
    else if (state) parts.push(state);
    else if (country && country !== "India") parts.push(country);
    if (level) {
      parts.push(LEVELS.find((l) => l.value === level)?.label ?? level);
    }
    if (q.trim()) parts.push(`“${q.trim()}”`);
    return parts;
  }, [kind, village, town, city, district, state, country, level, q]);

  const breadcrumb = [
    country || "India",
    state,
    district,
    city,
    town,
    village,
  ]
    .filter(Boolean)
    .join(" → ");

  const filterPanel = (
    <div className="space-y-5 p-4 sm:p-5">
      <div>
        <p className="mb-2 text-xs font-medium text-navy">What do you want to see?</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
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
        <p className="mb-3 text-xs font-medium text-navy">Location</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Level">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={selectClass}
            >
              {LEVELS.map((l) => (
                <option key={l.value || "any"} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nation / country">
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                clearLocal();
              }}
              className={selectClass}
            >
              <option value="">All countries</option>
              {(facets.countries.length ? facets.countries : ["India"]).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field label="State">
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setDistrict("");
                setCity("");
                setTown("");
                setVillage("");
              }}
              className={selectClass}
            >
              <option value="">All states</option>
              {facets.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="District">
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setCity("");
                setTown("");
                setVillage("");
              }}
              className={selectClass}
            >
              <option value="">All districts</option>
              {facets.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="City">
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setTown("");
              }}
              className={selectClass}
            >
              <option value="">All cities</option>
              {facets.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Town">
            <select
              value={town}
              onChange={(e) => setTown(e.target.value)}
              className={selectClass}
            >
              <option value="">All towns</option>
              {facets.towns.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Village (optional)">
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className={selectClass}
            >
              <option value="">All villages</option>
              {facets.villages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <Field label="Search topic">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search topic…"
            className={selectClass}
          />
        </Field>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            className="inline-flex min-h-11 items-center gap-2 bg-navy px-5 py-2 text-sm text-cream"
          >
            <IconSearch />
            Show results
          </button>
          <button
            type="button"
            onClick={clearLocal}
            className="py-2 text-sm text-muted hover:text-navy"
          >
            Clear place
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Browse by place
          </p>
          <h1 className="font-display mt-1 text-3xl text-navy sm:text-4xl">
            Explore
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Filter by what you want to see and where — problems, issues, votes,
            demands, and more.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/demands/new"
            className="px-1 py-2 text-sm text-muted hover:text-navy"
          >
            Raise a demand
          </Link>
          <Link
            href="/reports/new"
            className="bg-amber px-4 py-2 text-sm font-semibold text-navy"
          >
            Post for your place
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
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
            onClick={clearAll}
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
          aria-labelledby="explore-filter-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFilterOpen(false);
          }}
        >
          <div className="flex max-h-[min(92dvh,100%)] w-full max-w-2xl flex-col overflow-hidden border border-line bg-white shadow-xl sm:max-h-[min(85vh,40rem)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-5">
              <div>
                <p
                  id="explore-filter-title"
                  className="text-xs font-semibold uppercase tracking-wider text-navy"
                >
                  Filter
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  Type, place, and topic
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
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

      <section className="mt-6">
        <div className="mb-4">
          <p className="text-sm text-navy">
            Viewing: <strong>{breadcrumb || "All locations"}</strong>
          </p>
          {!loading && (
            <p className="mt-1 text-xs text-muted">
              {counts.total} results
              {counts.demands ? ` · ${counts.demands} demands` : ""}
              {counts.problems ? ` · ${counts.problems} problems` : ""}
              {counts.issues ? ` · ${counts.issues} issues` : ""}
              {counts.votes ? ` · ${counts.votes} votes` : ""}
            </p>
          )}
        </div>

        <div className="divide-y divide-line border-y border-line">
          {loading && <p className="py-8 text-sm text-muted">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="py-8 text-sm text-muted">
              Nothing for this place yet.{" "}
              <Link href="/reports/new" className="text-amber hover:underline">
                Be the first to post
              </Link>
              .
            </p>
          )}
          {items.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={item.href}
              className="block py-5 transition hover:bg-sand/40"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
                <span className="text-saffron">{item.kind}</span>
                <span>{item.locationLevel}</span>
                <span>{item.locationLabel}</span>
              </div>
              <h2 className="font-display mt-1 text-xl text-navy">
                {item.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted">
                {item.excerpt}
              </p>
              <p className="mt-2 text-xs text-muted">{item.meta}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
