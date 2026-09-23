"use client";

import Link from "next/link";
import { AD_CONFIG } from "@/config/ads";
import { publicLink } from "@/lib/config";

type Props = {
  reservedHeight: number;
};

export function HouseAdProvider({ reservedHeight }: Props) {
  const copy = AD_CONFIG.copy;
  const title = copy[AD_CONFIG.house.titleKey] ?? "";
  const body = copy[AD_CONFIG.house.bodyKey] ?? "";
  const hrefKey = AD_CONFIG.house.hrefKey;
  const href =
    hrefKey === "github" || hrefKey === "feedback" || hrefKey === "share"
      ? publicLink(hrefKey)
      : publicLink("github");

  return (
    <Link
      href={href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full flex-col justify-center rounded-xl border border-line bg-cream/80 px-4 py-3 transition hover:border-amber/40 hover:bg-sand/40"
      style={{ minHeight: reservedHeight }}
      data-ad-provider="house"
    >
      <span className="text-sm font-semibold text-navy">{title}</span>
      <span className="mt-1 text-xs leading-relaxed text-muted">{body}</span>
    </Link>
  );
}
