import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { mapProposal } from "@/lib/services";
import { VoteForm } from "@/components/VoteForm";
import { NonBindingLabel } from "@/components/Ui";
import { EngageBar } from "@/components/EngageBar";
import { MediaViewer } from "@/components/MediaViewer";
import { portalHref } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({ where: { id } });
  return { title: proposal?.title ?? "Vote" };
}

export default async function VotePage({ params }: Props) {
  const { id } = await params;
  const row = await prisma.proposal.findUnique({ where: { id } });
  if (!row) notFound();
  const proposal = mapProposal(row);

  const others = await prisma.proposal.findMany({
    where: { id: { not: id } },
    orderBy: { totalVotes: "desc" },
    take: 8,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        Open reform vote
      </p>
      <h1 className="font-display mt-2 break-words text-3xl text-navy sm:text-4xl">{proposal.title}</h1>
      <NonBindingLabel className="mt-3" />

      <p className="mt-6 text-lg leading-relaxed text-navy/90">
        {proposal.description}
      </p>

      {proposal.mediaUrl ? (
        <div className="mt-6 overflow-hidden">
          <MediaViewer
            url={proposal.mediaUrl}
            mediaType={proposal.mediaType}
            alt={proposal.title}
          />
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Benefits
        </h2>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {proposal.benefits.map((b) => (
            <li
              key={b}
              className="py-1 text-sm text-muted"
            >
              {b}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-success">
            Arguments for
          </h2>
          <ul className="mt-3 space-y-2">
            {proposal.argumentsFor.map((a) => (
              <li key={a} className="text-sm text-navy/90">
                · {a}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-danger">
            Arguments against
          </h2>
          <ul className="mt-3 space-y-2">
            {proposal.argumentsAgainst.map((a) => (
              <li key={a} className="text-sm text-navy/90">
                · {a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {proposal.issueSlug && (
        <p className="mt-6 text-sm">
          <Link
            href={portalHref(`/issues/${proposal.issueSlug}`)}
            className="text-amber hover:underline"
          >
            View related issue →
          </Link>
        </p>
      )}

      <div className="mt-10">
        <VoteForm proposal={proposal} />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Discussion</h2>
        <p className="mt-2 text-sm text-muted">
          Separate from the formal poll above — upvote, downvote, comment, and
          reply as anonymity IDs.
        </p>
        <div className="mt-6">
          <EngageBar
            targetType="proposal"
            targetId={proposal.id}
            sharePath={`/vote/${proposal.id}`}
            shareTitle={proposal.title}
            shareText={`${proposal.title} — discuss on Janark`}
          />
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy">Other open votes</h2>
          <Link href={portalHref("/vote/new")} className="text-sm text-amber hover:underline">
            Create vote
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {others.map((p) => (
            <li key={p.id}>
              <Link
                href={portalHref(`/vote/${p.id}`)}
                className="text-sm text-muted hover:text-amber"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
