"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MemeCard, type MemeCardData } from "@/components/MemeCard";
import { portalHref } from "@/lib/paths";

export function MemesBrowse() {
  const [memes, setMemes] = useState<MemeCardData[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/memes?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load memes");
      setMemes((data.memes ?? []) as MemeCardData[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load memes");
    } finally {
      setLoading(false);
    }
  }, [q, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-navy sm:text-4xl">Memes</h1>
          <p className="mt-2 text-sm text-muted">
            Civic humor and awareness — share what needs saying.
          </p>
        </div>
        <Link
          href={portalHref("/memes/new")}
          className="inline-flex bg-amber px-4 py-2.5 text-sm font-semibold text-on-amber hover:bg-amber-bright"
        >
          Post a meme
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search memes or hashtags"
          className="flex-1 border border-line bg-surface px-3 py-2 text-sm text-navy outline-none focus:border-amber"
        />
        <div className="flex gap-2">
          {(["hot", "new"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`px-3 py-2 text-sm ${
                sort === s
                  ? "bg-navy text-on-chrome"
                  : "border border-line text-muted hover:text-navy"
              }`}
            >
              {s === "hot" ? "Hot" : "New"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : error ? (
        <p className="mt-10 text-sm text-danger">{error}</p>
      ) : memes.length === 0 ? (
        <div className="mt-10 border border-dashed border-line px-6 py-12 text-center">
          <p className="text-muted">No memes yet.</p>
          <Link
            href={portalHref("/memes/new")}
            className="mt-4 inline-block text-link hover:underline"
          >
            Be the first to post
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          {memes.map((m) => (
            <MemeCard key={m.id} meme={m} onTagClick={(tag) => setQ(tag)} />
          ))}
        </div>
      )}
    </div>
  );
}
