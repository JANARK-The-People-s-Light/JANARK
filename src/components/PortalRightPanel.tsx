"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { portalHref } from "@/lib/paths";

type Topic = { tag: string; count: number };

function activityLabel(count: number) {
  if (count >= 50) return `${count} posts`;
  if (count >= 10) return `${count} active`;
  if (count === 1) return "1 post";
  return `${count} posts`;
}

/**
 * Right rail — Trending today with context, not bare counts.
 */
export function PortalRightPanel() {
  const pathname = usePathname();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hashtags", { cache: "no-store" });
      const data = await res.json();
      const all = ((data.hashtags ?? []) as Topic[]).filter(
        (t) => t.tag && t.tag.length >= 3 && (t.count ?? 0) >= 1,
      );
      const strong = all.filter((t) => t.count >= 2);
      setTopics((strong.length > 0 ? strong : all).slice(0, 8));
    } catch {
      setTopics([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (pathname.includes("/dashboard")) return;
    void load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, pathname]);

  if (pathname.includes("/dashboard")) {
    return null;
  }

  return (
    <aside
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[280px] shrink-0 flex-col overflow-y-auto overscroll-contain border-l border-line/60 px-6 py-8 xl:flex"
      aria-label="Trending today"
    >
      <p className="font-display text-lg text-navy">Trending today</p>
      <p className="mt-1 text-sm text-muted">What citizens are tagging</p>

      {!ready && topics.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : topics.length === 0 ? (
        <p className="mt-8 text-sm leading-relaxed text-muted">
          As people add topics to posts, the strongest ones rise here.
        </p>
      ) : (
        <ul className="mt-8 space-y-1">
          {topics.map((t, i) => (
            <li key={t.tag}>
              <Link
                href={portalHref(`/?tag=${encodeURIComponent(t.tag)}`)}
                className="group flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-sand/50"
              >
                <span className="mt-0.5 w-4 shrink-0 text-xs tabular-nums text-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-navy group-hover:text-navy-mid">
                    #{t.tag}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    ▲ {activityLabel(t.count)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
