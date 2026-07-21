"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getVoterKey } from "@/lib/client-id";
import { MemeCard, type MemeCardData } from "@/components/MemeCard";
import { HashtagFilter } from "@/components/HashtagFilter";
import { portalHref } from "@/lib/paths";

export default function MemesPage() {
  const [memes, setMemes] = useState<MemeCardData[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [tag, setTag] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("hot");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (q.trim()) params.set("q", q.trim());
    params.set("sort", sort);
    params.set("voterKey", getVoterKey());
    const [memeRes, tagRes] = await Promise.all([
      fetch(`/api/memes?${params}`, { cache: "no-store" }),
      fetch("/api/hashtags", { cache: "no-store" }),
    ]);
    const memeData = await memeRes.json();
    const tagData = await tagRes.json();
    setMemes(memeData.memes ?? []);
    setTags(tagData.hashtags ?? []);
    setLoading(false);
  }, [tag, q, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tag");
    if (t) setTag(t.replace(/^#/, ""));
  }, []);

  function selectTag(t: string) {
    setTag(t === tag ? "" : t);
    const url = new URL(window.location.href);
    if (t && t !== tag) url.searchParams.set("tag", t);
    else url.searchParams.delete("tag");
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Civic humour · live
          </p>
          <h1 className="font-display mt-1 text-3xl text-navy sm:text-4xl">
            Memes
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Browse freely. Login appears only when you post or vote — with
            complete anonymity.
          </p>
        </div>
        <Link
          href={portalHref("/memes/new")}
          className="bg-amber px-4 py-2.5 text-sm font-semibold text-navy"
        >
          Post a meme
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or #hashtag"
          className="w-full min-w-0 flex-1 border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="min-h-11 border border-line bg-white px-3 py-2 text-sm sm:w-36"
        >
          <option value="hot">Hot</option>
          <option value="new">Newest</option>
        </select>
      </div>

      {tags.length > 0 ? (
        <HashtagFilter
          className="mt-8"
          tags={tags}
          active={tag || undefined}
          onSelect={selectTag}
          limit={12}
        />
      ) : null}

      {loading && <p className="mt-10 text-sm text-muted">Loading memes…</p>}
      {!loading && memes.length === 0 && (
        <p className="mt-10 text-muted">
          No memes yet
          {tag ? ` for #${tag}` : ""}.{" "}
          <Link href={portalHref("/memes/new")} className="text-amber hover:underline">
            Be the first to post
          </Link>
          .
        </p>
      )}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {memes.map((m) => (
          <MemeCard key={m.id} meme={m} onTagClick={selectTag} compact />
        ))}
      </div>
    </div>
  );
}
