import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DemandActions } from "@/components/DemandActions";
import { AuthorLink } from "@/components/AuthorLink";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const demand = await prisma.publicDemand.findUnique({ where: { id } });
  return { title: demand?.title ?? "Public demand" };
}

export default async function DemandDetailPage({ params }: Props) {
  const { id } = await params;
  const demand = await prisma.publicDemand.findUnique({ where: { id } });
  if (!demand) notFound();

  const locationLabel = [
    demand.village,
    demand.town,
    demand.city,
    demand.block,
    demand.district,
    demand.state,
    demand.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        Public demand · {demand.status} · {demand.locationLevel} ·{" "}
        {locationLabel}
      </p>
      <h1 className="font-display mt-2 break-words text-3xl text-navy sm:text-4xl">{demand.title}</h1>
      <p className="mt-4 border-l-2 border-amber pl-4 text-lg font-medium text-navy">
        Ask: {demand.ask}
      </p>
      <p className="mt-3 text-sm text-muted">
        Target: {demand.target}
        {demand.targetDetail ? ` — ${demand.targetDetail}` : ""} ·{" "}
        <AuthorLink
          anonId={demand.authorAnonId}
          label={demand.authorLabel}
        />{" "}
        · {demand.createdAt.toISOString().slice(0, 10)}
      </p>
      <p className="mt-8 whitespace-pre-wrap text-lg leading-relaxed text-navy/90">
        {demand.body}
      </p>
      {demand.mediaUrl ? (
        <div className="mt-6 overflow-hidden">
          {demand.mediaType === "video" ? (
            <video
              src={demand.mediaUrl}
              controls
              playsInline
              className="max-h-[28rem] w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={demand.mediaUrl}
              alt=""
              className="max-h-[28rem] w-full object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      ) : null}
      <p className="mt-6 text-xs text-muted">
        Non-binding public demand. Upvote, downvote, and comment as your
        anonymity ID — phone number is never shown.
      </p>
      <div className="mt-10">
        <DemandActions demandId={demand.id} />
      </div>
    </div>
  );
}
