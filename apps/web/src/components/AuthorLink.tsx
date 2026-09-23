"use client";

import Link from "next/link";
import { usePreferences } from "@/components/PreferencesProvider";
import { portalHref } from "@/lib/paths";

type Props = {
  anonId?: string | null;
  label?: string | null;
  className?: string;
};

/** Clickable public anonymity ID (never a phone number). */
export function AuthorLink({ anonId, label, className }: Props) {
  const { prefs } = usePreferences();
  const text = label || (anonId ? `Anon ${anonId}` : "Anonymous citizen");
  if (!anonId) {
    return <span className={className}>{text}</span>;
  }
  // Privacy → “Allow profile discovery”: when off, don’t deep-link authors in this browser.
  if (!prefs.allowProfileDiscovery) {
    return (
      <span
        className={className ?? "text-link"}
        title="Profile links off in Settings → Privacy"
      >
        {text}
      </span>
    );
  }
  return (
    <Link
      href={portalHref(`/u/${anonId}`)}
      className={className ?? "text-link hover:underline"}
      title={`View anonymous profile ${anonId}`}
    >
      {text}
    </Link>
  );
}
