"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Stars } from "@/components/Ui";
import { IconSearch, IconX } from "@/components/Icons";
import { portalHref } from "@/lib/paths";

export type IssueListItem = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  rating: number;
  voteCount: number;
};

export function IssuesBrowse({ issues }: { issues: IssueListItem[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of issues) {
      counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [issues]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return issues.filter((i) => {
      if (category && i.category !== category) return false;
      if (!needle) return true;
      return `${i.title} ${i.summary} ${i.category}`.toLowerCase().includes(needle);
    });
  }, [issues, q, category]);

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 border border-line bg-white sm:min-w-[16rem]">
          <IconSearch className="ml-2.5 h-4 w-4 shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search issues…"
            className="min-h-11 min-w-0 flex-1 bg-transparent py-2 pr-2 pl-1 text-sm outline-none placeholder:text-muted"
            aria-label="Search issues"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="px-2 text-muted hover:text-navy"
              aria-label="Clear search"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`py-1.5 text-sm transition ${
            !category ? "font-medium text-amber" : "text-muted hover:text-navy"
          }`}
        >
          All
          <span className="ml-1.5 text-[11px] tabular-nums opacity-50">
            {issues.length}
          </span>
        </button>
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(category === cat ? "" : cat)}
            className={`py-1.5 text-sm transition ${
              category === cat
                ? "font-medium text-amber"
                : "text-muted hover:text-navy"
            }`}
          >
            {cat}
            <span className="ml-1.5 text-[11px] tabular-nums opacity-50">
              {count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-muted">
          {issues.length === 0 ? (
            <>
              No issues yet.{" "}
              <Link
                href={portalHref("/issues/new")}
                className="text-amber hover:underline"
              >
                Raise the first national issue
              </Link>
              .
            </>
          ) : (
            "No issues match your search."
          )}
        </p>
      ) : (
        <div className="mt-12 divide-y divide-line border-y border-line">
          {filtered.map((issue) => (
            <Link
              key={issue.slug}
              href={portalHref(`/issues/${issue.slug}`)}
              className="block py-5 transition hover:bg-sand/30"
            >
              <p className="text-xs uppercase tracking-wider text-muted">
                {issue.category}
              </p>
              <h2 className="font-display mt-1 text-xl text-navy">
                {issue.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted">
                {issue.summary}
              </p>
              <p className="mt-3 text-sm text-muted">
                {issue.rating > 0 ? (
                  <>
                    <Stars rating={issue.rating} /> ·{" "}
                  </>
                ) : null}
                {issue.voteCount > 0
                  ? `${issue.voteCount.toLocaleString("en-IN")} citizen signals`
                  : "No signals yet"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
