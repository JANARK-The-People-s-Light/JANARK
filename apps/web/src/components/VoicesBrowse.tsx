"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthModal";
import { IconSearch, IconX } from "@/components/Icons";
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

function VoicesInner() {
  const { ensureAuth, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const copy = templates.portal();
  const cfg = rules.portal().followSuggestions;
  const layout = sys.portal();

  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const qParam = searchParams.get("q") || "";

  const [q, setQ] = useState(qParam);
  const [people, setPeople] = useState<Person[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  const replaceQuery = useCallback(
    (next: { q?: string; page?: number }) => {
      const p = new URLSearchParams(searchParams.toString());
      const nextQ = next.q !== undefined ? next.q : qParam;
      const nextPage = next.page !== undefined ? next.page : page;
      if (nextQ.trim()) p.set("q", nextQ.trim());
      else p.delete("q");
      if (nextPage > 1) p.set("page", String(nextPage));
      else p.delete("page");
      const qs = p.toString();
      const path =
        typeof window !== "undefined" ? window.location.pathname : pathname;
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [pathname, router, searchParams, qParam, page],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (qParam.trim()) p.set("q", qParam.trim());
      if (page > 1) p.set("page", String(page));
      const res = await fetch(`/api/voices?${p.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        people?: Person[];
        pages?: number;
        total?: number;
        page?: number;
      };
      setPeople(
        (data.people ?? []).map((person) => ({
          ...person,
          viewerFollows: Boolean(person.viewerFollows),
          posts: Array.isArray(person.posts)
            ? person.posts.slice(0, Number(cfg.postsMax))
            : [],
        })),
      );
      setPages(Math.max(1, Number(data.pages ?? 1)));
      setTotal(Number(data.total ?? 0));
    } catch {
      setPeople([]);
      setPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [cfg.postsMax, page, qParam]);

  useEffect(() => {
    void load();
  }, [load, session?.anonId]);

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
          followers?: number;
        };
        if (!res.ok) return;
        setPeople((prev) =>
          prev.map((row) =>
            row.anonId === person.anonId
              ? {
                  ...row,
                  viewerFollows: Boolean(data.viewerFollows),
                  followers:
                    typeof data.followers === "number"
                      ? data.followers
                      : row.followers,
                }
              : row,
          ),
        );
      } finally {
        setBusyId(null);
      }
    },
    [copy.whoToFollowAuthReason, ensureAuth],
  );

  const carouselMaxWidth =
    Number(cfg.postsVisible) * Number(layout.followPostCardWidthPx) +
    Math.max(0, Number(cfg.postsVisible) - 1) *
      Number(layout.followPostCardGapPx);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-3xl text-navy">{copy.voicesPageTitle}</h1>
      {copy.voicesPageSubtitle ? (
        <p className="mt-2 text-sm text-muted">{copy.voicesPageSubtitle}</p>
      ) : null}

      <form
        className="mt-6 flex min-w-0 items-center gap-1 border border-line bg-white"
        onSubmit={(e) => {
          e.preventDefault();
          replaceQuery({ q, page: 1 });
        }}
      >
        <IconSearch className="ml-2.5 h-4 w-4 shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={copy.voicesSearchPlaceholder}
          className="min-h-11 min-w-0 flex-1 bg-transparent py-2 pr-2 pl-1 text-sm outline-none placeholder:text-muted"
          aria-label={copy.voicesSearchAria}
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              replaceQuery({ q: "", page: 1 });
            }}
            className="px-2 text-muted hover:text-navy"
            aria-label={copy.voicesSearchClearAria}
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      {loading ? (
        <p className="mt-10 text-sm text-muted">{copy.voicesLoading}</p>
      ) : people.length === 0 ? (
        <p className="mt-10 text-sm text-muted">{copy.voicesEmpty}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {people.map((p) => {
            const following = p.viewerFollows;
            const showUnfollow = following && hoverId === p.anonId;
            return (
              <li
                key={p.anonId}
                className="rounded-lg border border-line/70 bg-white px-3 py-3"
              >
                <div className="flex items-center gap-2">
                  <Link
                    href={portalHref(`/u/${p.anonId}`)}
                    className="min-w-0 flex-1"
                  >
                    <span className="block truncate font-mono text-sm text-navy hover:text-link">
                      {p.anonId}
                    </span>
                    <span className="text-[11px] tabular-nums text-muted">
                      {fill(copy.voicesFollowersLabel, {
                        count: p.followers,
                      })}
                    </span>
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === p.anonId}
                    onClick={() => void toggle(p)}
                    onMouseEnter={() => following && setHoverId(p.anonId)}
                    onMouseLeave={() => setHoverId(null)}
                    className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
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
                    className="mt-2.5 flex max-w-full overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

      {!loading && total > 0 ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs tabular-nums text-muted">
            {fill(copy.voicesPageLabel, { page, pages })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => replaceQuery({ page: page - 1 })}
              className="border border-line px-3 py-1.5 text-xs text-navy disabled:opacity-40"
            >
              {copy.voicesPrev}
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => replaceQuery({ page: page + 1 })}
              className="border border-line px-3 py-1.5 text-xs text-navy disabled:opacity-40"
            >
              {copy.voicesNext}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function VoicesBrowse() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted">
          {templates.portal().voicesLoading}
        </div>
      }
    >
      <VoicesInner />
    </Suspense>
  );
}
