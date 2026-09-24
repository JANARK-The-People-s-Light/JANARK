"use client";

import { useEffect, useMemo, useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_CONFIG } from "@/config/ads";

/**
 * Build insert indexes (before item at index) by walking the list and
 * jumping a random gap from `feedAdIntervalChoices` after each ad.
 * Client-only — avoids SSR/hydration mismatch from Math.random().
 */
export function useFeedAdBreakIndexes(
  itemCount: number,
  resetKey: string = "",
): Set<number> {
  const [indexes, setIndexes] = useState<number[]>([]);

  useEffect(() => {
    const choices = AD_CONFIG.feedAdIntervalChoices;
    if (
      itemCount <= 0 ||
      !choices?.length ||
      !AD_CONFIG.placements["feed-middle"]?.enabled
    ) {
      setIndexes([]);
      return;
    }

    const next: number[] = [];
    let cursor = 0;
    while (cursor < itemCount) {
      const gap =
        choices[Math.floor(Math.random() * choices.length)] ?? choices[0]!;
      cursor += gap;
      if (cursor >= itemCount) break;
      next.push(cursor);
    }
    setIndexes(next);
  }, [itemCount, resetKey]);

  return useMemo(() => new Set(indexes), [indexes]);
}

/** Renders a feed-middle ad when `index` is a scheduled break. */
export function FeedAdBreak({
  index,
  breakIndexes,
  className = "",
}: {
  index: number;
  breakIndexes: Set<number>;
  className?: string;
}) {
  if (!breakIndexes.has(index)) return null;
  return (
    <AdSlot
      placement="feed-middle"
      className={className || "border-y border-line/50 py-2"}
    />
  );
}
