"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FeedCard } from "@/components/Ui";
import { AdSlot } from "@/components/ads/AdSlot";
import { FeedEngage } from "@/components/FeedEngage";
import { AD_CONFIG } from "@/config/ads";
import { portalHref } from "@/lib/paths";

type Post = {
  id: string;
  publicId?: string | null;
  type: string;
  title: string;
  excerpt: string;
  href: string;
  meta: string;
  votes?: number;
  hot?: boolean;
  refId?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const feedRes = await fetch("/api/feed", { cache: "no-store" });
      const feed = await feedRes.json();
      setPosts(feed.posts ?? []);
      setError(null);
    } catch {
      setError("Could not load discussions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Open square
          </p>
          <h1 className="font-display mt-2 text-3xl text-navy sm:text-4xl">
            Discussions
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Upvote, downvote, comment, and reply — same simple controls
            everywhere. Login only when you engage; anonymity ID only.
          </p>
        </div>
        <Link
          href={portalHref("/feed/new")}
          className="bg-amber px-4 py-2.5 text-sm font-semibold text-on-amber"
        >
          Start a discussion
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      <AdSlot placement="feed-top" />

      <div className="mt-10">
        {loading && posts.length === 0 && (
          <p className="border-t border-line py-8 text-sm text-muted">
            Loading discussions…
          </p>
        )}
        {!loading && posts.length === 0 && (
          <p className="border-t border-line py-8 text-sm text-muted">
            No discussions yet.{" "}
            <Link
              href={portalHref("/feed/new")}
              className="text-link hover:underline"
            >
              Start the first one
            </Link>
            .
          </p>
        )}
        <div className="divide-y divide-line border-t border-line">
          {posts.map((item, index) => (
            <div key={item.id}>
              {index === AD_CONFIG.feedMiddleAfterIndex ? (
                <AdSlot placement="feed-middle" />
              ) : null}
              <div className="py-4">
                <FeedCard {...item} />
                <div className="mt-2">
                  <FeedEngage post={item} compact />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
