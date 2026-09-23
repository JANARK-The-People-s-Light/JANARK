"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthModal";
import { portalHref } from "@/lib/paths";

const SHARE_DRAFT_KEY = "janark-share-draft-v1";

const ORGANIZE = [
  { href: "/issues/new", label: "Raise an Issue" },
  { href: "/petitions/new", label: "Start a Petition" },
  { href: "/vote/new", label: "Create a Vote" },
  { href: "/feed/new", label: "Start a Discussion" },
  { href: "/notice/new", label: "Raise a Notice" },
  { href: "/memes/new", label: "Post a Meme" },
] as const;

/** Floating Create control — bottom-right on portal pages (above mobile nav). */
export function CreateActionMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { openLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
    setUploadError(null);
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

  function startShare() {
    setUploadError(null);
    setOpen(false);
    openLogin({
      reason: "share with your community",
      onSuccess: () => {
        window.setTimeout(() => fileRef.current?.click(), 40);
      },
    });
  }

  async function onShareFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const text = await res.text();
      let data: { error?: string; url?: string } = {};
      try {
        data = text ? (JSON.parse(text) as typeof data) : {};
      } catch {
        setUploadError("Upload failed");
        return;
      }
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }

      try {
        const raw = localStorage.getItem(SHARE_DRAFT_KEY);
        const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem(
          SHARE_DRAFT_KEY,
          JSON.stringify({ ...prev, mediaUrl: data.url }),
        );
      } catch {
        /* ignore quota */
      }

      router.push(portalHref("/share/new"));
    } catch {
      setUploadError("Network error while uploading");
    } finally {
      setUploading(false);
    }
  }

  // Coming-soon homepage has no portal chrome
  if (pathname === "/") return null;

  // Focused create flow — don't compete with the composer
  if (
    /\/(share|vote|issues|reports|petitions|feed|notice|memes)\/new\/?$/.test(
      pathname,
    )
  ) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] right-[max(0.75rem,env(safe-area-inset-right))] z-[90] flex max-h-[calc(100dvh-5.5rem)] flex-col items-end lg:bottom-[max(1.25rem,env(safe-area-inset-bottom))] lg:max-h-[calc(100dvh-2rem)]"
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onShareFile}
      />

      {uploadError ? (
        <p className="mb-2 max-w-[min(15rem,calc(100vw-5rem))] border border-danger/30 bg-white px-3 py-2 text-xs text-danger shadow-lg">
          {uploadError}
        </p>
      ) : null}

      {uploading ? (
        <p className="mb-2 border border-line bg-white px-3 py-2 text-xs text-muted shadow-lg">
          Uploading…
        </p>
      ) : null}

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="mb-2 max-h-[min(22rem,calc(100dvh-9rem))] min-w-[min(15.5rem,calc(100vw-2.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white py-2 text-navy shadow-xl"
        >
          <p className="px-4 pb-1 pt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-link">
            Quick
          </p>
          <ul>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                onClick={startShare}
                className="block w-full px-4 py-2.5 text-left text-sm text-navy transition hover:bg-cream hover:text-link"
              >
                Share
              </button>
            </li>
            <li role="none">
              <Link
                role="menuitem"
                href={portalHref("/reports/new")}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-navy transition hover:bg-cream hover:text-link"
              >
                Report
              </Link>
            </li>
          </ul>
          <div className="my-2 border-t border-line/80" />
          <p className="px-4 pb-1 pt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-fact">
            Organize
          </p>
          <ul>
            {ORGANIZE.map((a) => (
              <li key={a.href} role="none">
                <Link
                  role="menuitem"
                  href={portalHref(a.href)}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm text-navy transition hover:bg-cream hover:text-link"
                >
                  {a.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label={open ? "Close create menu" : "Create"}
        title="Create"
        onClick={() => setOpen((v) => !v)}
        disabled={uploading}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber text-2xl font-semibold leading-none text-on-amber shadow-lg transition hover:bg-amber-bright disabled:opacity-70"
      >
        <span aria-hidden>{open ? "×" : "+"}</span>
      </button>
    </div>
  );
}
