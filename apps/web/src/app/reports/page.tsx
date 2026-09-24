"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FeedAdBreak,
  useFeedAdBreakIndexes,
} from "@/components/ads/FeedAdBreak";
import { portalHref } from "@/lib/paths";

type Report = {
  id: string;
  type: string;
  title: string;
  body: string;
  locationLevel: string;
  locationLabel: string;
  authorLabel: string;
  upvotes: number;
  reactionTotal?: number;
  createdAt: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [type, setType] = useState("");
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (level) params.set("level", level);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/reports?${params}`, { cache: "no-store" });
    const data = await res.json();
    setReports(data.reports ?? []);
    setLoading(false);
  }, [type, level, q]);

  useEffect(() => {
    load();
  }, [load]);

  const adBreaks = useFeedAdBreakIndexes(reports.length, `${type}|${level}|${q}`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="sr-only">Citizen reports</h1>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={portalHref("/reports/new")}
          className="bg-amber px-4 py-2.5 text-sm font-semibold text-on-amber"
        >
          Report a problem
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="issue">Issue</option>
          <option value="crime">Crime</option>
          <option value="problem">Problem</option>
          <option value="other">Other</option>
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All levels</option>
          <option value="village">Village</option>
          <option value="block">Block</option>
          <option value="district">District</option>
          <option value="state">State</option>
          <option value="national">National</option>
          <option value="country">Country</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search place or topic"
          className="w-full min-w-0 flex-1 border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber sm:min-w-[200px]"
        />
        <button
          type="button"
          onClick={load}
          className="min-h-11 border border-navy bg-chrome px-4 py-2 text-sm text-on-chrome"
        >
          Filter
        </button>
      </div>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {loading && (
          <p className="py-8 text-sm text-muted">Loading reports…</p>
        )}
        {!loading && reports.length === 0 && (
          <p className="py-8 text-sm text-muted">
            No reports yet. Be the first from your village.
          </p>
        )}
        {reports.map((r, index) => (
          <div key={r.id}>
            <FeedAdBreak index={index} breakIndexes={adBreaks} />
          <Link
            href={portalHref(`/reports/${r.id}`)}
            className="block py-5 transition hover:bg-sand/40"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
              <span className="text-saffron">{r.type}</span>
              <span>{r.locationLevel}</span>
              <span>{r.locationLabel}</span>
            </div>
            <h2 className="font-display mt-1 text-xl text-navy">{r.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{r.body}</p>
            <p className="mt-3 text-xs text-muted">
              ↑ {r.upvotes} · {r.authorLabel} ·{" "}
              {String(r.createdAt).slice(0, 10)}
            </p>
          </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
