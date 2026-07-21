"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthModal";
import type { EngageTarget } from "@/lib/engage";
import { CommentThread } from "@/components/CommentThread";
import { ShareMenuButton } from "@/components/SocialShare";
import { ReportButton } from "@/components/ReportButton";
import {
  IconComment,
  IconDown,
  IconUp,
  iconBtnClass,
} from "@/components/Icons";

export type EngageCounts = {
  upvotes: number;
  downvotes: number;
  commentCount: number;
  score: number;
  myVote: number | null;
};

type Props = {
  targetType: Exclude<EngageTarget, "comment">;
  targetId: string;
  /** Path to share (e.g. /demands/abc). Defaults to current page if omitted. */
  sharePath?: string;
  shareTitle?: string;
  shareText?: string;
  /** Start with comments collapsed (still shows comment button) */
  barOnly?: boolean;
  className?: string;
  onChange?: (c: EngageCounts) => void;
};

export function EngageBar({
  targetType,
  targetId,
  sharePath,
  shareTitle,
  shareText,
  barOnly,
  className = "",
  onChange,
}: Props) {
  const { ensureAuth } = useAuth();
  const [counts, setCounts] = useState<EngageCounts>({
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
    score: 0,
    myVote: null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(!barOnly);
  const [resolvedSharePath, setResolvedSharePath] = useState(sharePath ?? "");

  useEffect(() => {
    if (sharePath) {
      setResolvedSharePath(sharePath);
      return;
    }
    if (typeof window !== "undefined") {
      setResolvedSharePath(
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, [sharePath]);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ targetType, targetId });
    const res = await fetch(`/api/engage?${qs}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!res.ok) return;
    const next: EngageCounts = {
      upvotes: data.upvotes ?? 0,
      downvotes: data.downvotes ?? 0,
      commentCount: data.commentCount ?? 0,
      score: data.score ?? 0,
      myVote: data.myVote ?? null,
    };
    setCounts(next);
    onChange?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid reloading when parent recreates onChange
  }, [targetType, targetId]);

  useEffect(() => {
    load();
  }, [load]);

  async function vote(choice: "upvote" | "downvote") {
    setError(null);
    const voterKey = ensureAuth(
      choice === "upvote" ? "upvote this post" : "downvote this post",
    );
    if (!voterKey) return;
    setBusy(true);
    try {
      const res = await fetch("/api/engage", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          choice,
          website: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Vote failed");
        return;
      }
      const next: EngageCounts = {
        upvotes: data.upvotes ?? 0,
        downvotes: data.downvotes ?? 0,
        commentCount: data.commentCount ?? counts.commentCount,
        score: data.score ?? 0,
        myVote: data.myVote ?? null,
      };
      setCounts(next);
      onChange?.(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => vote("upvote")}
          aria-label={`Upvote, ${counts.upvotes}`}
          title="Upvote"
          className={iconBtnClass(counts.myVote === 1)}
        >
          <IconUp />
          {counts.upvotes > 0 ? (
            <span className="min-w-[1ch] text-xs tabular-nums">{counts.upvotes}</span>
          ) : null}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => vote("downvote")}
          aria-label={`Downvote, ${counts.downvotes}`}
          title="Downvote"
          className={iconBtnClass(counts.myVote === -1, true)}
        >
          <IconDown />
          {counts.downvotes > 0 ? (
            <span className="min-w-[1ch] text-xs tabular-nums">
              {counts.downvotes}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-label={`Comments, ${counts.commentCount}`}
          title="Comments"
          className={iconBtnClass(showComments)}
        >
          <IconComment />
          {counts.commentCount > 0 ? (
            <span className="min-w-[1ch] text-xs tabular-nums">
              {counts.commentCount}
            </span>
          ) : null}
        </button>
        {resolvedSharePath ? (
          <ShareMenuButton
            path={resolvedSharePath}
            title={shareTitle}
            text={shareText}
          />
        ) : null}
        <ReportButton
          targetType={targetType}
          targetId={targetId}
          label="this post"
          className="ml-auto sm:ml-0.5"
        />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {showComments && (
        <CommentThread
          targetType={targetType}
          targetId={targetId}
          onCountChange={(n) => {
            setCounts((c) => {
              const next = { ...c, commentCount: n };
              onChange?.(next);
              return next;
            });
          }}
        />
      )}
    </div>
  );
}
