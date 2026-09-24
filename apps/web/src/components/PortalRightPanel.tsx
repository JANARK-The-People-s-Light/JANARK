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
 */
export function PortalRightPanel() {
  const pathname = usePathname();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [ready, setReady] = useState(false);
  const feed = rules.feed();
  const copy = templates.portal();
  const layout = sys.portal();

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
  }, [feed]);

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
      <p className="font-display text-lg tracking-tight text-navy">
        {copy.trendingTitle}
      </p>
      <p className="mt-1 text-sm text-muted">{copy.trendingSubtitle}</p>

      {!ready && topics.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{copy.trendingLoading}</p>
      ) : topics.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          {copy.trendingEmpty}
        </p>
      ) : (
        <ul className="mt-6 space-y-0.5">
          {topics.map((t, i) => (
            <li key={t.tag}>
              <Link
                href={portalHref(`/?tag=${encodeURIComponent(t.tag)}`)}
                className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-sand/50"
              >
                <span className="mt-0.5 w-4 shrink-0 text-xs tabular-nums text-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-navy group-hover:text-navy-mid">
                    #{t.tag}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {activityLabel(t.count)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <AdSlot placement="sidebar" className="mt-6" />

      <Link
        href={portalHref("/dashboard")}
        className="mt-auto pt-8 text-sm text-muted transition hover:text-link"
      >
        {copy.seeActivity}
      </Link>
    </aside>
  );
}
