"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconSearch, IconX } from "@/components/Icons";
import { sys, templates, rules } from "@/lib/config";
import { portalHref } from "@/lib/paths";
import { trackClientInteraction } from "@/lib/track-client";

/**
 * Portal header search — sits beside the brand mark.
 * Writes `q` on feed/pulse pages; otherwise opens the portal home with the query.
 * Below `lg`, opens a search popup; from `lg` up, shows the inline field.
 */
export function PortalHeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const copy = templates.portal();
  const layout = sys.portal();
  const titleId = useId();
  const qParam = searchParams.get("q") || "";
  const [q, setQ] = useState(qParam);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  useEffect(() => {
    if (!open) return;
    popupInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function applyQuery(next: string | null) {
    const trimmed = (next ?? "").trim();
    const base = pathname.replace(/\/$/, "") || "/";
    const home = portalHref("/").replace(/\/$/, "") || "/unreleased";
    const pulse = portalHref("/dashboard").replace(/\/$/, "");
    const staysOnPage = base === home || base === pulse;

    if (trimmed) {
      const maxQ = rules.interactions().maxQueryChars;
      trackClientInteraction("search.query", {
        path: pathname,
        props: { q: trimmed.slice(0, maxQ), source: "header" },
      });
    }

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

  function submitAndClose() {
    applyQuery(q);
    setOpen(false);
  }

  const popup =
    mounted && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-start justify-center bg-chrome/50 p-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:p-6 sm:pt-20 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-cream shadow-xl">
              <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
                <p
                  id={titleId}
                  className="text-sm font-semibold text-navy"
                >
                  {copy.headerSearchDialogTitle}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand hover:text-navy"
                  aria-label={copy.headerSearchCloseAria}
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAndClose();
                }}
                className="flex items-center gap-2 p-3"
                role="search"
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5">
                  <IconSearch className="h-4 w-4 shrink-0 text-muted" />
                  <input
                    ref={popupInputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={copy.headerSearchPlaceholder}
                    className="min-h-11 min-w-0 flex-1 bg-transparent py-2 text-sm text-navy outline-none placeholder:text-muted"
                    aria-label={copy.headerSearchAria}
                  />
                  {q ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        applyQuery(null);
                      }}
                      className="text-muted hover:text-navy"
                      aria-label={copy.headerSearchClearAria}
                    >
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-chrome px-3 py-2.5 text-sm font-semibold text-on-chrome"
                >
                  {copy.headerSearchSubmit}
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-on-chrome/80 transition hover:border-amber-bright/40 hover:bg-white/10 hover:text-amber-bright lg:hidden"
        aria-label={copy.headerSearchAria}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <IconSearch className="h-4 w-4" />
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyQuery(q);
        }}
        className="hidden min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 lg:flex"
        style={{ maxWidth: layout.headerSearchMaxWidthPx }}
        role="search"
      >
        <IconSearch className="ml-2.5 h-4 w-4 shrink-0 text-on-chrome/60" />
        <input
          ref={inputRef}
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
      {popup}
    </>
  );
}
