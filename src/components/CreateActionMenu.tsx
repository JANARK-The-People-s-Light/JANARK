"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { portalHref } from "@/lib/paths";

const ACTIONS = [
  { href: "/petitions/new", label: "Start a petition" },
  { href: "/reports/new", label: "Report an issue" },
  { href: "/vote/new", label: "Create a vote" },
  { href: "/issues/new", label: "Raise a national issue" },
  { href: "/memes/new", label: "Post a meme" },
  { href: "/notice/new", label: "Raise a notice" },
  { href: "/feed", label: "Start a discussion" },
] as const;

/** Floating Create control — bottom-right on portal pages. */
export function CreateActionMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Coming-soon homepage has no portal chrome
  if (pathname === "/") return null;

  return (
    <div
      ref={rootRef}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[90] flex flex-col items-end"
    >
      {open ? (
        <ul
          id={menuId}
          role="menu"
          className="mb-2 min-w-[15rem] border border-line bg-white py-1 text-navy shadow-xl"
        >
          {ACTIONS.map((a) => (
            <li key={a.href} role="none">
              <Link
                role="menuitem"
                href={portalHref(a.href)}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-navy hover:bg-cream hover:text-amber"
              >
                {a.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label={open ? "Close create menu" : "Create"}
        title="Create"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center bg-amber text-2xl font-semibold leading-none text-navy shadow-lg transition hover:bg-amber-bright"
      >
        <span aria-hidden>{open ? "×" : "+"}</span>
      </button>
    </div>
  );
}
