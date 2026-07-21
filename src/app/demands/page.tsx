"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { portalHref } from "@/lib/paths";

type Demand = {
  id: string;
  title: string;
  body: string;
  ask: string;
  target: string;
  targetDetail?: string | null;
  status: string;
  locationLevel: string;
  locationLabel: string;
  authorLabel: string;
  supportCount: number;
  createdAt: string;
};

export default function DemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (level) params.set("level", level);
    const res = await fetch(`/api/demands?${params}`, { cache: "no-store" });
    const data = await res.json();
    setDemands(data.demands ?? []);
    setLoading(false);
  }, [q, level]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Collective will · live
          </p>
          <h1 className="font-display mt-1 text-3xl text-navy sm:text-4xl">
            Public demands
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Citizens set a clear ask and gather anonymous support — from town
            streets to the nation.
          </p>
        </div>
        <Link
          href={portalHref("/demands/new")}
          className="bg-amber px-4 py-2.5 text-sm font-semibold text-navy"
        >
          Raise a demand
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All levels</option>
          <option value="town">Town</option>
          <option value="city">City</option>
          <option value="district">District</option>
          <option value="state">State</option>
          <option value="national">Nation</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search demands…"
          className="w-full min-w-0 flex-1 border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber sm:min-w-[200px]"
        />
        <button
          type="button"
          onClick={load}
          className="min-h-11 bg-navy px-4 py-2 text-sm text-cream"
        >
          Search
        </button>
        <Link
          href={portalHref("/explore?kind=demands")}
          className="px-1 py-2 text-sm text-muted hover:text-navy"
        >
          By location →
        </Link>
      </div>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {loading && <p className="py-8 text-sm text-muted">Loading…</p>}
        {!loading && demands.length === 0 && (
          <p className="py-8 text-sm text-muted">
            No demands yet.{" "}
            <Link href={portalHref("/demands/new")} className="text-amber hover:underline">
              Raise the first one
            </Link>
            .
          </p>
        )}
        {demands.map((d) => (
          <Link
            key={d.id}
            href={portalHref(`/demands/${d.id}`)}
            className="block py-5 transition hover:bg-sand/40"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
              <span className="text-saffron">demand</span>
              <span>{d.status}</span>
              <span>{d.locationLevel}</span>
              <span>{d.locationLabel}</span>
            </div>
            <h2 className="font-display mt-1 text-xl text-navy">{d.title}</h2>
            <p className="mt-2 text-sm font-medium text-navy/80">Ask: {d.ask}</p>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{d.body}</p>
            <p className="mt-3 text-xs text-muted">
              {d.supportCount.toLocaleString("en-IN")} supporters ·{" "}
              {d.authorLabel}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
