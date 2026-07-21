"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FeedCard } from "@/components/Ui";
import { useAuth } from "@/components/AuthModal";
import { FeedEngage } from "@/components/FeedEngage";
import { MediaAttach } from "@/components/MediaAttach";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
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
  const { ensureAuth } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [trends, setTrends] = useState<{ term: string; score: number }[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feedRes, dashRes] = await Promise.all([
        fetch("/api/feed", { cache: "no-store" }),
        fetch("/api/dashboard", { cache: "no-store" }),
      ]);
      const feed = await feedRes.json();
      const dash = await dashRes.json();
      setPosts(feed.posts ?? []);
      setTrends(dash.trends ?? []);
    } catch {
      setError("Could not load live feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    const voterKey = ensureAuth("start a discussion");
    if (!voterKey) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          author: "Anonymous citizen",
          kind: "opinion",
          voterKey,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to post");
        return;
      }
      setTitle("");
      setBody("");
      setMediaUrl("");
      setAcceptedTerms(false);
      await load();
    } catch {
      setError("Network error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[1fr_240px]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Open square
          </p>
          <h1 className="font-display mt-2 text-3xl text-navy sm:text-4xl">
            Home feed
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Upvote, downvote, comment, and reply — same simple controls
            everywhere. Login only when you engage; anonymity ID only.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-3 border-t border-line pt-8"
          >
            <h2 className="font-display text-xl text-navy">
              Start a discussion
            </h2>
            {error && <p className="text-sm text-danger">{error}</p>}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Topic"
              required
              className="w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What should citizens notice?"
              required
              rows={3}
              className="w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
            />
            <MediaAttach value={mediaUrl} onChange={setMediaUrl} />
            <PostTermsAccept
              accepted={acceptedTerms}
              onAcceptedChange={setAcceptedTerms}
            />
            <button
              type="submit"
              disabled={posting || !acceptedTerms}
              className="bg-navy px-4 py-2 text-sm font-medium text-cream disabled:opacity-60"
            >
              {posting ? "Posting…" : "Publish anonymously"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
            <Link
              href={portalHref("/notice/new")}
              className="text-sm text-muted hover:text-navy"
            >
              Raise notice
            </Link>
            <Link
              href={portalHref("/vote/new")}
              className="text-sm text-muted hover:text-navy"
            >
              Create vote
            </Link>
            <Link
              href={portalHref("/issues/new")}
              className="text-sm text-muted hover:text-navy"
            >
              New issue
            </Link>
            <Link
              href={portalHref("/memes/new")}
              className="text-sm text-muted hover:text-navy"
            >
              Post a meme
            </Link>
          </div>

          <div className="mt-10">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-saffron">
              Live stream
            </h2>
            {loading && posts.length === 0 && (
              <p className="py-6 text-sm text-muted">Loading feed…</p>
            )}
            {!loading && posts.length === 0 && (
              <p className="border-t border-line py-8 text-sm text-muted">
                No posts yet. Publish a discussion above — it appears here
                immediately.
              </p>
            )}
            <div className="divide-y divide-line border-t border-line">
              {posts.map((item) => (
                <div key={item.id} className="py-4">
                  <FeedCard {...item} />
                  <div className="mt-2">
                    <FeedEngage post={item} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Live trends
          </h2>
          {trends.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Trends appear as citizens vote and post.
            </p>
          ) : (
            <ul className="mt-4 max-h-[13.75rem] space-y-0 overflow-y-auto overscroll-contain pr-1">
              {trends.slice(0, 30).map((t) => (
                <li key={t.term}>
                  <Link
                    href={portalHref("/issues")}
                    className="flex h-11 items-center justify-between border-b border-line text-sm text-navy hover:text-amber"
                  >
                    <span className="truncate pr-2">{t.term}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {t.score}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
