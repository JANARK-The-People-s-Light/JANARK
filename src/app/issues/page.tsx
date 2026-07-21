import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { computeIssueLiveMetrics, mapIssue } from "@/lib/services";
import { Stars } from "@/components/Ui";
import { portalHref } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "National Issues",
};

const CATEGORIES = [
  "Education",
  "Employment",
  "Healthcare",
  "Corruption",
  "Judiciary",
  "Women",
  "Agriculture",
  "Environment",
  "Infrastructure",
  "Police",
  "Cybersecurity",
  "Voting Reform",
];

export default async function IssuesPage() {
  const rows = await prisma.issue.findMany({
    orderBy: [{ voteCount: "desc" }],
  });
  const issues = (
    await Promise.all(
      rows.map(async (row) => {
        const m = await computeIssueLiveMetrics(row.slug);
        return mapIssue({
          ...row,
          voteCount: m.voteCount,
          rating: m.rating,
        });
      }),
    )
  ).sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            National issues
          </p>
          <h1 className="font-display mt-1 text-3xl text-navy sm:text-4xl">
            National issues
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Every issue follows the same structure — updated as citizens vote
            and discuss.
          </p>
        </div>
        <Link
          href={portalHref("/issues/new")}
          className="bg-navy px-4 py-2 text-sm font-medium text-cream hover:bg-navy-mid"
        >
          Raise new issue
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap gap-x-3 gap-y-1">
        {CATEGORIES.map((cat) => {
          const count = issues.filter((i) => i.category === cat).length;
          return (
            <span
              key={cat}
              className="py-1.5 text-sm text-muted"
            >
              {cat}
              {count > 0 ? (
                <span className="ml-1.5 text-[11px] tabular-nums opacity-50">
                  {count}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>

      {issues.length === 0 ? (
        <p className="mt-12 text-muted">
          No issues yet.{" "}
          <Link href={portalHref("/issues/new")} className="text-amber hover:underline">
            Raise the first national issue
          </Link>
          .
        </p>
      ) : (
        <div className="mt-12 divide-y divide-line border-y border-line">
          {issues.map((issue) => (
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
    </div>
  );
}
