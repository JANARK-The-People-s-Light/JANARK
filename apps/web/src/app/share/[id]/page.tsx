"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FeedEngage } from "@/components/FeedEngage";
import { AdSlot } from "@/components/ads/AdSlot";
import { OwnContentMenu } from "@/components/OwnContentMenu";
import { portalHref } from "@/lib/paths";

type Share = {
  id: string;
  publicId?: string | null;
  caption: string;
  mediaUrl: string;
  mediaType?: string | null;
  locationLabel?: string | null;
  city?: string | null;
  issueSlug?: string | null;
  petitionId?: string | null;
  authorLabel: string;
  authorAnonId?: string | null;
  createdAt: string;
};

const CONVERT = [
  {
    href: "/reports/new",
    label: "Convert to Report",
    hint: "When this needs official attention",
  },
  {
    href: "/issues/new",
    label: "Raise an Issue",
    hint: "When this is a recurring civic problem",
  },
  {
    href: "/petitions/new",
    label: "Start a Petition",
    hint: "When you want signatures for change",
  },
  {
    href: "/feed/new",
    label: "Start a Discussion",
    hint: "When you want community debate",
  },
] as const;

export default function ShareDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [share, setShare] = useState<Share | null>(null);
  const [isMine, setIsMine] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedId, setFeedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/shares/${id}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not found");
      return;
    }
    setShare(data.share);
    setIsMine(Boolean(data.isMine));
    if (data.feedPostId) setFeedId(String(data.feedPostId));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-muted">{error}</p>
        <Link href={portalHref("/")} className="mt-4 inline-block text-link">
          Back to feed
        </Link>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-muted">
        Loading…
      </div>
    );
  }

  const place =
    share.locationLabel ||
    [share.city].filter(Boolean).join(", ") ||
    null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href={portalHref("/")}
        className="text-sm text-muted hover:text-link"
      >
        ← Feed
      </Link>

      <article className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-navy/50">
          Community Post
        </p>

        {share.mediaUrl ? (
          share.mediaType === "video" ? (
            <video
              src={share.mediaUrl}
              controls
              className="mt-4 w-full rounded-xl bg-chrome/5"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={share.mediaUrl}
              alt=""
              className="mt-4 w-full rounded-xl object-cover"
            />
          )
        ) : null}

        <p className="mt-5 whitespace-pre-wrap text-[17px] leading-relaxed text-navy">
          {share.caption}
        </p>

        <p className="mt-4 text-sm text-muted">
          {share.authorLabel}
          {place ? ` · ${place}` : ""}
          {" · "}
          {new Date(share.createdAt).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <OwnContentMenu
          className="mt-4"
          endpoint={`/api/shares/${share.id}`}
          authorAnonId={share.authorAnonId}
          isMine={isMine}
          fields={{ caption: share.caption }}
          labels={{ caption: "Caption" }}
          onUpdated={(data) => {
            const d = data as { share?: Share; isMine?: boolean };
            if (d.share) setShare(d.share);
            if (d.isMine) setIsMine(true);
          }}
          onDeleted={() => router.push(portalHref("/"))}
        />

        {share.issueSlug ? (
          <p className="mt-3 text-sm">
            <Link
              href={portalHref(`/issues/${share.issueSlug}`)}
              className="text-link hover:underline"
            >
              Related issue
            </Link>
          </p>
        ) : null}
        {share.petitionId ? (
          <p className="mt-1 text-sm">
            <Link
              href={portalHref(`/petitions/${share.petitionId}`)}
              className="text-link hover:underline"
            >
              Linked petition
            </Link>
          </p>
        ) : null}

        <div className="mt-6 border-t border-line pt-4">
          <FeedEngage
            post={{
              id: feedId || share.id,
              publicId: share.publicId,
              type: "share",
              refId: share.id,
              title: share.caption.slice(0, 120),
              href: `/share/${share.id}`,
              tags: ["share", "community"],
            }}
            compact={false}
          />
        </div>
      </article>

      <AdSlot placement="post-bottom" />

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="text-base font-medium text-navy">Take this further</h2>
        <p className="mt-1 text-sm text-muted">
          Shared lightly — turn it into structured civic action when ready.
        </p>
        <ul className="mt-5 space-y-2">
          {CONVERT.map((c) => (
            <li key={c.href}>
              <Link
                href={portalHref(c.href)}
                className="flex flex-col rounded-xl border border-line px-4 py-3 transition hover:border-amber/40 hover:bg-sand/30"
              >
                <span className="text-sm font-medium text-navy">{c.label}</span>
                <span className="text-xs text-muted">{c.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
