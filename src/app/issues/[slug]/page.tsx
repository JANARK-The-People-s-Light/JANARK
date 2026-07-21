import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { computeIssueLiveMetrics, mapIssue, mapProposal } from "@/lib/services";
import { Stars } from "@/components/Ui";
import { EngageBar } from "@/components/EngageBar";
import { MediaViewer } from "@/components/MediaViewer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = { params: Promise<{ slug: string }> };

const site =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issue = await prisma.issue.findUnique({ where: { slug } });
  if (!issue) return { title: "Issue" };
  const mapped = mapIssue(issue);
  const url = `${site}/issues/${mapped.slug}`;
  return {
    title: mapped.title,
    description: mapped.summary,
    openGraph: {
      title: `${mapped.title} · Janark`,
      description: mapped.summary,
      url,
      siteName: "Janark",
      type: "article",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: mapped.title,
      description: mapped.summary,
    },
  };
}

export default async function IssueDetailPage({ params }: Props) {
  const { slug } = await params;
  const issueRow = await prisma.issue.findUnique({ where: { slug } });
  if (!issueRow) notFound();

  const live = await computeIssueLiveMetrics(slug);
  const issue = mapIssue({
    ...issueRow,
    voteCount: live.voteCount,
    rating: live.rating,
  });
  const [proposals, relatedRows] = await Promise.all([
    prisma.proposal.findMany({ where: { issueSlug: slug } }),
    prisma.issue.findMany({
      where: { slug: { in: issue.relatedSlugs } },
    }),
  ]);

  const related = await Promise.all(
    relatedRows.map(async (row) => {
      const m = await computeIssueLiveMetrics(row.slug);
      return mapIssue({ ...row, voteCount: m.voteCount, rating: m.rating });
    }),
  );
  const linkedVotes = proposals.map(mapProposal);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        {issue.category}
      </p>
      <h1 className="font-display mt-2 break-words text-3xl text-navy sm:text-5xl">
        {issue.title}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {live.rating > 0 ? (
          <>
            <Stars rating={live.rating} /> ·{" "}
          </>
        ) : null}
        {live.voteCount.toLocaleString("en-IN")} citizen signals
        {live.voteCount === 0 ? " · none yet" : null}
      </p>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Summary
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-navy/90">
          {issue.summary}
        </p>
        {issue.mediaUrl ? (
          <div className="mt-5 overflow-hidden">
            <MediaViewer
              url={issue.mediaUrl}
              mediaType={issue.mediaType}
              alt={issue.title}
            />
          </div>
        ) : null}
      </section>

      <section className="mt-10 border-l-2 border-fact pl-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-fact">
          Current situation · Facts
        </h2>
        <p className="mt-3 leading-relaxed text-navy/90">
          {issue.currentSituation}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-navy">Why it matters</h2>
        <p className="mt-3 leading-relaxed text-muted">{issue.whyItMatters}</p>
      </section>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-success">
            Pros / Arguments for
          </h2>
          <ul className="mt-3 space-y-2">
            {issue.pros.map((p) => (
              <li key={p} className="text-sm leading-relaxed text-navy/90">
                · {p}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-danger">
            Cons / Arguments against
          </h2>
          <ul className="mt-3 space-y-2">
            {issue.cons.map((c) => (
              <li key={c} className="text-sm leading-relaxed text-navy/90">
                · {c}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Discussion</h2>
        <p className="mt-2 text-sm text-muted">
          Upvote, downvote, comment, and reply — all as anonymity IDs.
        </p>
        <div className="mt-6">
          <EngageBar
            targetType="issue"
            targetId={slug}
            sharePath={`/issues/${slug}`}
            shareTitle={issue.title}
            shareText={`${issue.title} — discuss on Janark`}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Vote</h2>
        <ul className="mt-4 space-y-3">
          {linkedVotes.length === 0 && (
            <li>
              <Link href="/vote/new" className="text-amber hover:underline">
                Create a vote for this issue →
              </Link>
            </li>
          )}
          {linkedVotes.map((p) => (
            <li key={p.id}>
              <Link
                href={`/vote/${p.id}`}
                className="block border-b border-line py-3 transition hover:text-amber"
              >
                <span className="font-medium text-navy">{p.title}</span>
                <span className="mt-1 block text-xs text-muted">
                  {p.totalVotes.toLocaleString("en-IN")} votes
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-navy">Related issues</h2>
          <ul className="mt-4 space-y-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/issues/${r.slug}`}
                  className="text-navy hover:text-amber"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Sources
        </h2>
        <ul className="mt-3 space-y-1">
          {issue.sources.map((s) => (
            <li key={s.url + s.label}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-fact hover:underline"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
