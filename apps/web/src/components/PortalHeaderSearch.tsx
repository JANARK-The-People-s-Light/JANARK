"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconSearch, IconX } from "@/components/Icons";
import { sys, templates } from "@/lib/config";
import { portalHref } from "@/lib/paths";

/**
 * Portal header search — sits beside the brand mark.
 * Writes `q` on feed/pulse pages; otherwise opens the portal home with the query.
 */
export function PortalHeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const copy = templates.portal();
  const layout = sys.portal();
  const qParam = searchParams.get("q") || "";
  const [q, setQ] = useState(qParam);

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  function applyQuery(next: string | null) {
    const trimmed = (next ?? "").trim();
    const base = pathname.replace(/\/$/, "") || "/";
    const home = portalHref("/").replace(/\/$/, "") || "/unreleased";
    const pulse = portalHref("/dashboard").replace(/\/$/, "");
    const staysOnPage = base === home || base === pulse;

    if (staysOnPage) {
      const p = new URLSearchParams(searchParams.toString());
      if (trimmed) p.set("q", trimmed);
      else p.delete("q");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      return;
    }

    const target = trimmed
      ? portalHref(`/?q=${encodeURIComponent(trimmed)}`)
      : portalHref("/");
    router.push(target);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyQuery(q);
      }}
      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10"
      style={{ maxWidth: layout.headerSearchMaxWidthPx }}
      role="search"
    >
      <IconSearch className="ml-2.5 h-4 w-4 shrink-0 text-on-chrome/60" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={copy.headerSearchPlaceholder}
        className="min-h-9 min-w-0 flex-1 bg-transparent py-1.5 pr-2 text-sm text-on-chrome outline-none placeholder:text-on-chrome/45"
        aria-label={copy.headerSearchAria}
      />
      {q ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            applyQuery(null);
          }}
          className="px-2.5 text-on-chrome/60 hover:text-amber-bright"
          aria-label={copy.headerSearchClearAria}
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </form>
  );
}
