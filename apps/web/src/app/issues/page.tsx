import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { computeIssueLiveMetrics, mapIssue } from "@/lib/services";
import { IssuesBrowse } from "@/components/IssuesBrowse";
import { portalHref } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "National Issues",
};

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
        <div className="flex flex-wrap gap-2">
          <Link
            href={portalHref("/vote/new")}
            className="border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-cream"
          >
            Start a vote
          </Link>
          <Link
            href={portalHref("/issues/new")}
            className="bg-chrome px-4 py-2 text-sm font-medium text-on-chrome hover:bg-chrome-mid"
          >
            Raise new issue
          </Link>
        </div>
      </div>

      <IssuesBrowse
        issues={issues.map((i) => ({
          slug: i.slug,
          title: i.title,
          summary: i.summary,
          category: i.category,
          rating: i.rating,
          voteCount: i.voteCount,
        }))}
      />
    </div>
  );
}
