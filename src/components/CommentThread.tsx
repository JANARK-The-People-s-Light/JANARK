"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { AuthorLink } from "@/components/AuthorLink";
import { MediaAttach } from "@/components/MediaAttach";
import { MediaViewer } from "@/components/MediaViewer";
import { ReportButton } from "@/components/ReportButton";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import type { EngageTarget } from "@/lib/engage";
import type { MediaType } from "@/lib/media";
import { termsPayload } from "@/lib/civic-post-terms";
import {
  IconDown,
  IconReply,
  IconUp,
  IconX,
  iconBtnClass,
} from "@/components/Icons";

type Comment = {
  id: string;
  body: string;
  authorLabel: string;
  authorAnonId: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: number | null;
  createdAt: string;
  parentId: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  replies: Comment[];
};

type Props = {
  targetType: Exclude<EngageTarget, "comment">;
  targetId: string;
  onCountChange?: (topLevelCount: number) => void;
};

function countTopLevel(comments: Comment[]) {
  return comments.length;
}

export function CommentThread({
  targetType,
  targetId,
  onCountChange,
}: Props) {
  const { ensureAuth } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyMedia, setReplyMedia] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ targetType, targetId });
    const res = await fetch(`/api/comments?${qs}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!res.ok) return;
    const list = (data.comments ?? []) as Comment[];
    setComments(list);
    onCountChange?.(countTopLevel(list));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(
    body: string,
    parentId: string | null,
    media?: string,
  ) {
    setError(null);
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to comment.");
      return;
    }
    const voterKey = ensureAuth(
      parentId ? "reply anonymously" : "comment anonymously",
    );
    if (!voterKey) return;
    const mediaLink = (media ?? "").trim();
    if (body.trim().length < 2 && !mediaLink) {
      setError("Write a short comment or add a GIF");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          body: body.trim(),
          mediaUrl: mediaLink || undefined,
          parentId,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not post");
        return;
      }
      const list = (data.comments ?? []) as Comment[];
      setComments(list);
      onCountChange?.(countTopLevel(list));
      if (parentId) {
        setReplyTo(null);
        setReplyDraft("");
        setReplyMedia("");
      } else {
        setDraft("");
        setMediaUrl("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function voteComment(id: string, choice: "upvote" | "downvote") {
    const voterKey = ensureAuth("vote on this comment");
    if (!voterKey) return;
    const res = await fetch("/api/engage", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "comment",
        targetId: id,
        choice,
        website: "",
      }),
    });
    if (res.ok) await load();
  }

  return (
    <div className="mt-6 border-t border-line pt-6">
      <h3 className="font-display text-lg text-navy">Comments</h3>
      <p className="mt-1 text-xs text-muted">
        Posted as your anonymity ID. Phone number is never shown.
      </p>

      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(draft, null, mediaUrl);
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          className="w-full border border-line bg-white px-3 py-2 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
        />
        <MediaAttach value={mediaUrl} onChange={setMediaUrl} gifOnly />
        <PostTermsAccept
          accepted={acceptedTerms}
          onAcceptedChange={setAcceptedTerms}
          compact
        />
        <button
          type="submit"
          disabled={busy || !acceptedTerms}
          className="bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-mid disabled:opacity-60"
        >
          {busy ? "Posting…" : "Comment"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <ul className="mt-6 space-y-5">
        {comments.length === 0 && (
          <li className="text-sm text-muted">No comments yet — start the thread.</li>
        )}
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            depth={0}
            replyTo={replyTo}
            replyDraft={replyDraft}
            replyMedia={replyMedia}
            busy={busy}
            acceptedTerms={acceptedTerms}
            onReply={(id) => {
              setReplyTo(id);
              setReplyDraft("");
              setReplyMedia("");
            }}
            onCancelReply={() => setReplyTo(null)}
            onReplyDraft={setReplyDraft}
            onReplyMedia={setReplyMedia}
            onSubmitReply={() => {
              if (replyTo) void submit(replyDraft, replyTo, replyMedia);
            }}
            onVote={voteComment}
          />
        ))}
      </ul>
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  replyTo,
  replyDraft,
  replyMedia,
  busy,
  acceptedTerms,
  onReply,
  onCancelReply,
  onReplyDraft,
  onReplyMedia,
  onSubmitReply,
  onVote,
}: {
  comment: Comment;
  depth: number;
  replyTo: string | null;
  replyDraft: string;
  replyMedia: string;
  busy: boolean;
  acceptedTerms: boolean;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onReplyDraft: (v: string) => void;
  onReplyMedia: (v: string) => void;
  onSubmitReply: () => void;
  onVote: (id: string, choice: "upvote" | "downvote") => void;
}) {
  const isReplying = replyTo === comment.id;
  return (
    <li className={depth > 0 ? "ml-4 border-l border-line pl-4 sm:ml-6" : ""}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted">
        <AuthorLink
          anonId={comment.authorAnonId}
          label={comment.authorLabel}
          className="font-medium text-amber hover:underline"
        />
        <span>· {comment.createdAt.slice(0, 10)}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-navy/90">
        {comment.body}
      </p>
      {comment.mediaUrl ? (
        <div className="mt-2 max-w-sm overflow-hidden border border-line">
          <MediaViewer
            url={comment.mediaUrl}
            mediaType={(comment.mediaType as MediaType) ?? undefined}
            compact
            alt="Comment media"
          />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          onClick={() => onVote(comment.id, "upvote")}
          aria-label={`Upvote, ${comment.upvotes}`}
          title="Upvote"
          className={iconBtnClass(comment.myVote === 1)}
        >
          <IconUp className="h-3.5 w-3.5" />
          {comment.upvotes > 0 ? (
            <span className="text-[11px] tabular-nums">{comment.upvotes}</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onVote(comment.id, "downvote")}
          aria-label={`Downvote, ${comment.downvotes}`}
          title="Downvote"
          className={iconBtnClass(comment.myVote === -1, true)}
        >
          <IconDown className="h-3.5 w-3.5" />
          {comment.downvotes > 0 ? (
            <span className="text-[11px] tabular-nums">{comment.downvotes}</span>
          ) : null}
        </button>
        {depth < 3 && (
          <button
            type="button"
            onClick={() => onReply(comment.id)}
            aria-label="Reply"
            title="Reply"
            className={iconBtnClass(false)}
          >
            <IconReply className="h-3.5 w-3.5" />
          </button>
        )}
        <ReportButton
          targetType="comment"
          targetId={comment.id}
          label={depth > 0 ? "this reply" : "this comment"}
          className="ml-auto"
        />
      </div>

      {isReplying && (
        <div className="mt-3 space-y-2">
          <textarea
            value={replyDraft}
            onChange={(e) => onReplyDraft(e.target.value)}
            rows={2}
            placeholder={`Reply to ${comment.authorAnonId ?? "anon"}…`}
            className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-amber focus:outline-none"
            autoFocus
          />
          <MediaAttach value={replyMedia} onChange={onReplyMedia} gifOnly />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !acceptedTerms}
              onClick={onSubmitReply}
              className="inline-flex items-center gap-1.5 bg-navy px-3 py-1.5 text-xs text-cream disabled:opacity-60"
            >
              <IconReply className="h-3.5 w-3.5" />
              Reply
            </button>
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Cancel reply"
              title="Cancel"
              className="inline-flex items-center justify-center rounded-sm p-1.5 text-navy/60 hover:text-navy"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <ul className="mt-4 space-y-4">
          {comment.replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              depth={depth + 1}
              replyTo={replyTo}
              replyDraft={replyDraft}
              replyMedia={replyMedia}
              busy={busy}
              acceptedTerms={acceptedTerms}
              onReply={onReply}
              onCancelReply={onCancelReply}
              onReplyDraft={onReplyDraft}
              onReplyMedia={onReplyMedia}
              onSubmitReply={onSubmitReply}
              onVote={onVote}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
