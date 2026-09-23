"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/components/AuthModal";

type Props = {
  targetAnonId: string;
  initialFollowing?: boolean;
  isSelf?: boolean;
  className?: string;
  onChange?: (state: {
    viewerFollows: boolean;
    followers: number;
    followingCount: number;
  }) => void;
};

/**
 * Follow / Following toggle for anonymous profiles.
 */
export function FollowButton({
  targetAnonId,
  initialFollowing = false,
  isSelf = false,
  className = "",
  onChange,
}: Props) {
  const { ensureAuth } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverUnfollow, setHoverUnfollow] = useState(false);

  const toggle = useCallback(async () => {
    setError(null);
    const key = ensureAuth("follow this citizen");
    if (!key) return;
    setBusy(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonId: targetAnonId,
          action: following ? "unfollow" : "follow",
          website: "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        viewerFollows?: boolean;
        followers?: number;
        followingCount?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not update follow");
        return;
      }
      const next = Boolean(data.viewerFollows);
      setFollowing(next);
      onChange?.({
        viewerFollows: next,
        followers: Number(data.followers ?? 0),
        followingCount: Number(data.followingCount ?? 0),
      });
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }, [ensureAuth, following, onChange, targetAnonId]);

  if (isSelf) {
    return (
      <span
        className={`inline-flex min-h-11 items-center px-4 text-sm text-muted ${className}`}
      >
        Your profile
      </span>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggle()}
        onMouseEnter={() => following && setHoverUnfollow(true)}
        onMouseLeave={() => setHoverUnfollow(false)}
        className={`min-h-11 min-w-[7.5rem] px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
          following
            ? hoverUnfollow
              ? "border border-danger bg-white text-danger"
              : "border border-line bg-white text-navy"
            : "bg-amber text-on-amber hover:bg-amber-bright"
        }`}
      >
        {busy
          ? "…"
          : following
            ? hoverUnfollow
              ? "Unfollow"
              : "Following"
            : "Follow"}
      </button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
