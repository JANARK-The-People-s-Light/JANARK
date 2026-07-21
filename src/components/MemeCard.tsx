"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthorLink } from "@/components/AuthorLink";
import { EngageBar } from "@/components/EngageBar";
import { InlineTags } from "@/components/HashtagFilter";
import { MediaViewer } from "@/components/MediaViewer";
import type { MediaType } from "@/lib/media";
import { portalHref } from "@/lib/paths";

export type MemeCardData = {
  id: string;
  title: string;
  caption?: string | null;
  imageUrl: string;
  mediaType?: MediaType | string | null;
  sourceUrl?: string | null;
  authorLabel: string;
  authorAnonId?: string | null;
  upvotes: number;
  downvotes: number;
  shareCount: number;
  score: number;
  tags: string[];
  myVote?: number | null;
  commentCount?: number;
  createdAt?: string;
};

type Props = {
  meme: MemeCardData;
  onTagClick?: (tag: string) => void;
  compact?: boolean;
};

export function MemeCard({ meme, onTagClick, compact }: Props) {
  const [data, setData] = useState(meme);

  useEffect(() => {
    setData(meme);
  }, [meme]);

  return (
    <article className="border-b border-line py-6">
      <Link href={portalHref(`/memes/${data.id}`)} className="block overflow-hidden">
        <MediaViewer
          url={data.imageUrl}
          mediaType={(data.mediaType as MediaType) ?? undefined}
          alt={data.title}
          className={compact ? "max-h-64" : "max-h-[28rem]"}
        />
      </Link>
      <div className="pt-4">
        <Link href={portalHref(`/memes/${data.id}`)}>
          <h2 className="font-display text-xl text-navy hover:text-amber">
            {data.title}
          </h2>
        </Link>
        {data.caption && (
          <p className="mt-2 text-sm text-muted">{data.caption}</p>
        )}
        <InlineTags
          className="mt-3"
          tags={data.tags}
          onSelect={onTagClick}
          limit={4}
        />
        <p className="mt-3 text-xs text-muted">
          <AuthorLink
            anonId={data.authorAnonId}
            label={data.authorLabel}
            className="text-amber hover:underline"
          />
        </p>

        <EngageBar
          className="mt-4"
          targetType="meme"
          targetId={data.id}
          barOnly={compact}
          sharePath={`/memes/${data.id}`}
          shareTitle={data.title}
          shareText={`Check this on Janark: ${data.title}`}
          onChange={(c) =>
            setData((d) => ({
              ...d,
              upvotes: c.upvotes,
              downvotes: c.downvotes,
              score: c.score,
              myVote: c.myVote,
              commentCount: c.commentCount,
            }))
          }
        />
      </div>
    </article>
  );
}
