"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { NonBindingLabel } from "@/components/Ui";
import { portalHref } from "@/lib/paths";

type Proposal = {
  id: string;
  title: string;
  description: string;
  voteType: string;
  totalVotes: number;
  issueSlug?: string;
  mediaUrl?: string | null;
};

const VOTE_TYPE_LABEL: Record<string, string> = {
  likert: "Rating",
  checklist: "Select all",
  preference: "Choice",
};

export default function VotesPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [q, setQ] = useState("");
  const [voteType, setVoteType] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proposals", { cache: "no-store" });
      const data = await res.json();
      let list = (data.proposals ?? []) as Proposal[];
      const needle = q.trim().toLowerCase();
      if (needle) {
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(needle) ||
            p.description.toLowerCase().includes(needle),
        );
      }
      if (voteType) {
        list = list.filter((p) => p.voteType === voteType);
      }
      setProposals(list);
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [q, voteType]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Open mandate · non-binding
          </p>
          <h1 className="font-display mt-1 text-3xl text-navy sm:text-4xl">
            Votes
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Create or cast votes on reforms and civic questions. Results are
            public signals — not government decisions.
          </p>
          <NonBindingLabel className="mt-3" />
        </div>
        <Link
          href={portalHref("/vote/new")}
          className="bg-amber px-4 py-2.5 text-sm font-semibold text-on-amber"
        >
          Create a vote
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <select
          value={voteType}
          onChange={(e) => setVoteType(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All formats</option>
          <option value="preference">Choice</option>
          <option value="checklist">Select all</option>
          <option value="likert">Rating</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search votes…"
          className="w-full min-w-0 flex-1 border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber sm:min-w-[200px]"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-11 bg-chrome px-4 py-2 text-sm text-on-chrome"
        >
          Search
        </button>
      </div>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {loading && <p className="py-8 text-sm text-muted">Loading votes…</p>}
        {!loading && proposals.length === 0 && (
          <p className="py-8 text-sm text-muted">
            No open votes yet.{" "}
            <Link
              href={portalHref("/vote/new")}
              className="text-link hover:underline"
            >
              Create the first one
            </Link>
            .
          </p>
        )}
        {proposals.map((p) => (
          <article key={p.id} className="py-5">
            <Link
              href={portalHref(`/vote/${p.id}`)}
              className="block transition hover:opacity-90"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
                <span className="text-saffron">vote</span>
                <span>{VOTE_TYPE_LABEL[p.voteType] ?? p.voteType}</span>
                {p.issueSlug ? <span>linked issue</span> : null}
              </div>
              <h2 className="font-display mt-1 text-xl text-navy">{p.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted">
                {p.description}
              </p>
              <p className="mt-3 text-sm text-navy">
                {p.totalVotes.toLocaleString("en-IN")}{" "}
                {p.totalVotes === 1 ? "vote" : "votes"} · cast yours →
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
