import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdSlot } from "@/components/ads/AdSlot";
import { ReportActions } from "@/components/ReportActions";
import { ReportOwnControls } from "@/components/ReportOwnControls";
import { AuthorLink } from "@/components/AuthorLink";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const report = await prisma.citizenReport.findUnique({ where: { id } });
  return { title: report?.title ?? "Report" };
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const report = await prisma.citizenReport.findUnique({ where: { id } });
  if (!report) notFound();

  const locationLabel = [
    report.village,
    report.town,
    report.city,
    report.block,
    report.district,
    report.state,
    report.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        {report.type} · {report.locationLevel} · {locationLabel}
      </p>
      <h1 className="font-display mt-2 break-words text-3xl text-navy sm:text-4xl">
        {report.title}
      </h1>
      <p className="mt-3 text-sm text-muted">
        <AuthorLink anonId={report.authorAnonId} label={report.authorLabel} /> ·{" "}
        {report.createdAt.toISOString().slice(0, 10)}
      </p>
      <ReportOwnControls
        id={report.id}
        authorAnonId={report.authorAnonId}
        title={report.title}
        body={report.body}
      />
      <p className="mt-8 whitespace-pre-wrap text-lg leading-relaxed text-navy/90">
        {report.body}
      </p>
      {report.mediaUrl ? (
        <div className="mt-6 overflow-hidden">
          {report.mediaType === "video" ? (
            <video
              src={report.mediaUrl}
              controls
              playsInline
              className="max-h-[28rem] w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.mediaUrl}
              alt=""
              className="max-h-[28rem] w-full object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      ) : null}
      <p className="mt-6 text-xs text-muted">
        Non-binding citizen signal. Not a police FIR. For emergencies, contact
        local authorities.
      </p>
      <div className="mt-10">
        <ReportActions reportId={report.id} />
      </div>
      <AdSlot placement="post-bottom" />
    </div>
  );
}
