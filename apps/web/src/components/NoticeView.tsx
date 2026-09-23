"use client";

import { useEffect, useState } from "react";
import { DemoBadge } from "@/components/Ui";
import { AuthorLink } from "@/components/AuthorLink";
import { EngageBar } from "@/components/EngageBar";
import { MediaViewer } from "@/components/MediaViewer";
import type { MediaType } from "@/lib/media";

type NoticeData = {
  id: string;
  title: string;
  description: string;
  target: string;
  targetDetail?: string | null;
  author: string;
  authorAnonId?: string | null;
  signatures: number;
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: string;
};

export function NoticeView({ id }: { id: string }) {
  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/notices/${id}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Not found");
        setNotice({
          ...data.notice,
          createdAt: String(data.notice.createdAt).slice(0, 10),
        });
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-muted">Loading notice…</p>;
  }

  if (error || !notice) {
    return (
      <p className="text-muted">
        Notice not found{error ? `: ${error}` : ""}.
      </p>
    );
  }

  return (
    <article className="max-w-2xl space-y-8">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted">
            Notice · {notice.target}
            {notice.targetDetail ? ` · ${notice.targetDetail}` : ""}
          </span>
          <DemoBadge />
        </div>
        <h1 className="font-display text-3xl text-navy sm:text-4xl">
          {notice.title}
        </h1>
        <p className="mt-3 text-sm text-muted">
          Raised by{" "}
          <AuthorLink anonId={notice.authorAnonId} label={notice.author} /> ·{" "}
          {notice.createdAt}
        </p>
        <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-navy/90">
          {notice.description}
        </p>
        {notice.mediaUrl ? (
          <div className="mt-6 overflow-hidden border border-line">
            <MediaViewer
              url={notice.mediaUrl}
              mediaType={(notice.mediaType as MediaType) ?? undefined}
              alt={notice.title}
            />
          </div>
        ) : null}
      </div>

      <EngageBar
        targetType="notice"
        targetId={notice.id}
        sharePath={`/notice/${notice.id}`}
        shareTitle={notice.title}
        shareText={`Notice on Janark: ${notice.title}`}
      />
    </article>
  );
}
