"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { fill, rules, sys, templates } from "@/lib/config";
import { portalHref } from "@/lib/paths";

type Topic = { tag: string; count: number };

function activityLabel(count: number) {
  const copy = templates.portal();
  const feed = rules.feed();
  if (count >= feed.activityPostsLabelMinCount) {
    return fill(copy.activityPosts, { count });
  }
  if (count >= feed.activityActiveLabelMinCount) {
    return fill(copy.activityActive, { count });
  }
  if (count === 1) return copy.activityOnePost;
  return fill(copy.activityPosts, { count });
}

/**
 * Right rail — Trending today with context, not bare counts.
 * Thresholds/copy from config/rules.json + config/templates.json.
 * Shows a short viewport of topics; list scrolls up to trendingMaxTopics.
 */
export function PortalRightPanel() {
  const pathname = usePathname();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [ready, setReady] = useState(false);
  const feed = rules.feed();
  const copy = templates.portal();
  const layout = sys.portal();
  const listMaxHeightPx =
    feed.trendingVisibleTopics * layout.trendingTopicRowHeightPx +
    Math.max(0, feed.trendingVisibleTopics - 1) * layout.trendingTopicGapPx;

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hashtags", { cache: "no-store" });
      const text = await res.text();
      const data = text
        ? (JSON.parse(text) as { hashtags?: Topic[] })
        : { hashtags: [] };
      const all = ((data.hashtags ?? []) as Topic[]).filter(
        (t) =>
          t.tag &&
          t.tag.length >= feed.hashtagMinTagLength &&
          (t.count ?? 0) >= feed.hashtagMinCount,
      );
      const strong = all.filter((t) => t.count >= feed.trendingStrongMinCount);
      setTopics(
        (strong.length > 0 ? strong : all).slice(0, feed.trendingMaxTopics),
      );
    } catch {
      setTopics([]);
    } finally {
      setReady(true);
    }
  }, [
    feed.hashtagMinTagLength,
    feed.hashtagMinCount,
    feed.trendingStrongMinCount,
    feed.trendingMaxTopics,
  ]);

  useEffect(() => {
    if (pathname.includes("/dashboard")) return;
    void load();
    const t = setInterval(load, feed.hashtagPollIntervalMs);
    return () => clearInterval(t);
  }, [load, pathname, feed.hashtagPollIntervalMs]);

  if (pathname.includes("/dashboard")) {
    return null;
  }

  return (
    <aside
      className="hidden h-full min-h-0 shrink-0 flex-col overflow-y-auto overscroll-contain border-l border-line/50 px-5 py-7 lg:flex"
      style={{ width: layout.rightRailWidthPx }}
      aria-label={copy.trendingAriaLabel}
    >
      <AdSlot placement="sidebar" className="mb-6 mt-0 shrink-0" />

      <p className="shrink-0 font-display text-lg tracking-tight text-navy">
        {copy.trendingTitle}
      </p>
      <p className="mt-1 shrink-0 text-sm text-muted">{copy.trendingSubtitle}</p>

      {!ready && topics.length === 0 ? (
        <p className="mt-6 shrink-0 text-sm text-muted">{copy.trendingLoading}</p>
      ) : topics.length === 0 ? (
        <p className="mt-6 shrink-0 text-sm leading-relaxed text-muted">
          {copy.trendingEmpty}
        </p>
      ) : (
        <div
          className="mt-6 shrink-0 overflow-y-auto overscroll-contain"
          style={
            topics.length > feed.trendingVisibleTopics
              ? { height: listMaxHeightPx, maxHeight: listMaxHeightPx }
              : { maxHeight: listMaxHeightPx }
          }
        >
          <ul
            className="flex flex-col"
            style={{ gap: layout.trendingTopicGapPx }}
          >
            {topics.map((t) => (
              <li key={t.tag}>
                <Link
                  href={portalHref(`/?tag=${encodeURIComponent(t.tag)}`)}
                  className="group flex items-center rounded-lg px-2 transition hover:bg-sand/50"
                  style={{ minHeight: layout.trendingTopicRowHeightPx }}
                >
                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                    <span className="truncate text-[15px] font-medium text-navy group-hover:text-navy-mid">
                      #{t.tag}
                    </span>
                    <span className="shrink-0 text-right text-xs tabular-nums text-muted">
                      {activityLabel(t.count)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AdSlot
        placement="sidebar-below-trending"
        className="mb-0 mt-6 shrink-0"
      />

      <Link
        href={portalHref("/dashboard")}
        className="mt-auto pt-8 text-sm text-muted transition hover:text-link"
      >
        {copy.seeActivity}
      </Link>
    </aside>
  );
}
