"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { fill, rules, sys, templates } from "@/lib/config";
import { portalHref } from "@/lib/paths";

type SuggestionPost = {
  id: string;
  title: string;
  href: string;
  votes: number;
  type: string;
  mediaUrl: string | null;
  mediaType: string | null;
};

type Person = {
  anonId: string;
  label: string;
  followers: number;
  viewerFollows: boolean;
  posts: SuggestionPost[];
};

/**
 * Left-rail “Rising voices” suggestions — after primary nav.
 * Each person shows a compact horizontal carousel of popular posts
 * (few cards in view; more scroll into view, capped by config).
 */
export function WhoToFollow({ onNavigate }: { onNavigate?: () => void }) {
  const { ensureAuth, session } = useAuth();
  const copy = templates.portal();
  const cfg = rules.portal().followSuggestions;
  const layout = sys.portal();
  const [people, setPeople] = useState<Person[]>([]);
  const [ready, setReady] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/follow/suggestions", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const text = await res.text();
      const data = text
        ? (JSON.parse(text) as { people?: Person[] })
        : { people: [] };
      setPeople(
        (data.people ?? []).slice(0, Number(cfg.maxPeople)).map((p) => ({
          ...p,
          viewerFollows: Boolean(p.viewerFollows),
          posts: Array.isArray(p.posts)
            ? p.posts.slice(0, Number(cfg.postsMax))
            : [],
        })),
      );
    } catch {
      setPeople([]);
    } finally {
      setReady(true);
    }
  }, [cfg.maxPeople, cfg.postsMax]);

  useEffect(() => {
    void load();
    const t = setInterval(load, Number(cfg.pollIntervalMs));
    return () => clearInterval(t);
  }, [load, cfg.pollIntervalMs, session?.anonId]);

  const toggle = useCallback(
    async (person: Person) => {
      const key = ensureAuth(copy.whoToFollowAuthReason);
      if (!key) return;
      setBusyId(person.anonId);
      try {
        const res = await fetch("/api/follow", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anonId: person.anonId,
            action: person.viewerFollows ? "unfollow" : "follow",
            website: "",
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          viewerFollows?: boolean;
        };
        if (!res.ok) return;
        const next = Boolean(data.viewerFollows);
        if (next) {
          setPeople((prev) => prev.filter((p) => p.anonId !== person.anonId));
          void load();
        } else {
          setPeople((prev) =>
            prev.map((p) =>
              p.anonId === person.anonId ? { ...p, viewerFollows: next } : p,
            ),
          );
        }
      } finally {
        setBusyId(null);
      }
    },
    [copy.whoToFollowAuthReason, ensureAuth, load],
  );

  const carouselMaxWidth =
    Number(cfg.postsVisible) * Number(layout.followPostCardWidthPx) +
    Math.max(0, Number(cfg.postsVisible) - 1) *
      Number(layout.followPostCardGapPx);

  return (
    <section className="mt-6" aria-label={copy.whoToFollowAriaLabel}>
      <div className="mb-2 flex items-center gap-2 px-3">
        <p className="flex min-w-0 flex-1 items-center gap-2 font-display text-sm font-semibold tracking-tight text-navy">
          <span
            className="h-3.5 w-0.5 shrink-0 rounded-full bg-amber"
            aria-hidden
          />
          {copy.whoToFollowTitle}
        </p>
        <Link
          href={portalHref(sys.paths().voices)}
          onClick={onNavigate}
          className="shrink-0 text-[11px] font-medium text-link hover:underline"
        >
          {copy.whoToFollowSeeMore}
        </Link>
      </div>
      {!ready ? (
        <p className="px-3 text-sm text-muted">{copy.whoToFollowLoading}</p>
      ) : people.length === 0 ? (
        <p className="px-3 text-sm leading-relaxed text-muted">
          {copy.whoToFollowEmpty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {people.map((p) => {
            const following = p.viewerFollows;
            const showUnfollow = following && hoverId === p.anonId;
            return (
              <li
                key={p.anonId}
                className="flex flex-col gap-1.5 rounded-lg px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <Link
                    href={portalHref(`/u/${p.anonId}`)}
                    onClick={onNavigate}
                    className="min-w-0 flex-1 truncate font-mono text-xs text-navy/80 hover:text-link"
                    title={p.anonId}
                  >
                    {p.anonId}
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === p.anonId}
                    onClick={() => void toggle(p)}
                    onMouseEnter={() => following && setHoverId(p.anonId)}
                    onMouseLeave={() => setHoverId(null)}
                    className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold transition disabled:opacity-60 ${
                      following
                        ? showUnfollow
                          ? "border border-danger bg-white text-danger"
                          : "border border-line bg-white text-navy"
                        : "bg-amber text-on-amber hover:bg-amber-bright"
                    }`}
                  >
                    {busyId === p.anonId
                      ? copy.whoToFollowBusy
                      : following
                        ? showUnfollow
                          ? copy.whoToFollowUnfollow
                          : copy.whoToFollowFollowing
                        : copy.whoToFollowFollow}
                  </button>
                </div>
                {p.posts.length > 0 ? (
                  <div
                    className="flex max-w-full overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{
                      maxWidth: carouselMaxWidth,
                      gap: layout.followPostCardGapPx,
                      scrollSnapType: "x mandatory",
                    }}
                    aria-label={fill(copy.whoToFollowPostsAria, {
                      anonId: p.anonId,
                    })}
                  >
                    {p.posts.map((post) => (
                      <Link
                        key={`${p.anonId}:${post.id}`}
                        href={portalHref(post.href)}
                        onClick={onNavigate}
                        className="relative shrink-0 snap-start overflow-hidden rounded-md border border-line/70 bg-sand/40 transition hover:border-line hover:bg-sand/60"
                        style={{
                          width: layout.followPostCardWidthPx,
                          height: layout.followPostCardHeightPx,
                        }}
                        title={post.title}
                      >
                        {post.mediaUrl && post.mediaType !== "video" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.mediaUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="absolute inset-0 bg-gradient-to-br from-sand to-sand/40"
                            aria-hidden
                          />
                        )}
                        <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-chrome/80 via-chrome/55 to-transparent px-1.5 pb-1 pt-3 text-[10px] leading-snug text-cream">
                          {post.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
