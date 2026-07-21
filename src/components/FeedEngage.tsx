"use client";

import { EngageBar } from "@/components/EngageBar";
import type { EngageTarget } from "@/lib/engage";

/** Map a feed/mongo post type + ids to unified engage target */
export function engageTargetForFeedPost(post: {
  id: string;
  type?: string;
  refId?: string | null;
}): { targetType: Exclude<EngageTarget, "comment">; targetId: string } {
  const type = (post.type || "").toLowerCase();
  const ref = post.refId?.trim();
  if (ref) {
    if (type === "meme") return { targetType: "meme", targetId: ref };
    if (type === "report") return { targetType: "report", targetId: ref };
    if (type === "demand") return { targetType: "demand", targetId: ref };
    if (type === "notice") return { targetType: "notice", targetId: ref };
    if (type === "issue") return { targetType: "issue", targetId: ref };
  }
  return { targetType: "feed", targetId: post.id };
}

type Props = {
  post: { id: string; type?: string; refId?: string | null; title?: string; href?: string };
  /** List cards: comments collapsed until opened */
  compact?: boolean;
};

export function FeedEngage({ post, compact = true }: Props) {
  const { targetType, targetId } = engageTargetForFeedPost(post);
  const sharePath =
    post.href?.trim() ||
    (targetType === "meme" && post.refId
      ? `/memes/${post.refId}`
      : targetType === "report" && post.refId
        ? `/reports/${post.refId}`
        : targetType === "demand" && post.refId
          ? `/demands/${post.refId}`
          : targetType === "notice" && post.refId
            ? `/notice/${post.refId}`
            : targetType === "issue" && post.refId
              ? `/issues/${post.refId}`
              : `/feed?post=${post.id}`);

  return (
    <EngageBar
      targetType={targetType}
      targetId={targetId}
      barOnly={compact}
      sharePath={sharePath}
      shareTitle={post.title}
    />
  );
}
