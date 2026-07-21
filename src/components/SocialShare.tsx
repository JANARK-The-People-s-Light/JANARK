"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  buildShareUrls,
  trackShare,
  type SocialPlatform,
} from "@/lib/client-id";
import {
  IconCopy,
  IconDeviceShare,
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconShare,
  IconWhatsApp,
  IconXTwitter,
  iconBtnClass,
} from "@/components/Icons";

type Props = {
  path: string;
  title: string;
  text?: string;
  className?: string;
  /** Compact menu for engage bar popover */
  variant?: "panel" | "menu";
  onDone?: () => void;
};

const PLATFORMS: {
  id: SocialPlatform;
  label: string;
  icon: ReactNode;
}[] = [
  { id: "whatsapp", label: "WhatsApp", icon: <IconWhatsApp /> },
  { id: "facebook", label: "Facebook", icon: <IconFacebook /> },
  { id: "linkedin", label: "LinkedIn", icon: <IconLinkedIn /> },
  { id: "twitter", label: "X / Twitter", icon: <IconXTwitter /> },
  { id: "instagram", label: "Instagram", icon: <IconInstagram /> },
  { id: "copy", label: "Copy link", icon: <IconCopy /> },
];

export function SocialShare({
  path,
  title,
  text,
  className = "",
  variant = "panel",
  onDone,
}: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [origin, setOrigin] = useState(
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "",
  );

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      setOrigin(window.location.origin);
    }
  }, []);

  const absoluteUrl = useMemo(() => {
    const base = origin || "";
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }, [path, origin]);

  const urls = useMemo(
    () => buildShareUrls({ url: absoluteUrl, title, text }),
    [absoluteUrl, title, text],
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setStatus("Link copied");
      setTimeout(() => setStatus(null), 2500);
    } catch {
      setStatus(absoluteUrl);
    }
  }

  async function onShare(platform: SocialPlatform) {
    await trackShare(platform, path, title);

    if (platform === "copy") {
      await copyLink();
      onDone?.();
      return;
    }

    if (platform === "instagram") {
      await copyLink();
      window.open(urls.instagram, "_blank", "noopener,noreferrer");
      setStatus("Link copied — paste into Instagram");
      onDone?.();
      return;
    }

    const target =
      platform === "linkedin"
        ? urls.linkedin
        : urls[platform as keyof typeof urls];
    if (typeof target === "string") {
      window.open(target, "_blank", "noopener,noreferrer,width=600,height=500");
      onDone?.();
    }
  }

  async function onNativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title,
        text: text ?? title,
        url: absoluteUrl,
      });
      await trackShare("native", path, title);
      onDone?.();
    } catch {
      // cancelled
    }
  }

  if (variant === "menu") {
    return (
      <div className={`w-56 border border-line bg-white shadow-lg ${className}`}>
        <p className="border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Share to
        </p>
        <ul className="py-1">
          {PLATFORMS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onShare(p.id)}
                className="flex min-h-10 w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-navy hover:bg-sand/60"
              >
                <span className="text-muted">{p.icon}</span>
                {p.label}
              </button>
            </li>
          ))}
          {canNativeShare ? (
            <li>
              <button
                type="button"
                onClick={onNativeShare}
                className="flex min-h-10 w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-navy hover:bg-sand/60"
              >
                <span className="text-muted">
                  <IconDeviceShare />
                </span>
                Device share…
              </button>
            </li>
          ) : null}
        </ul>
        {status ? (
          <p className="border-t border-line px-3 py-2 text-xs text-success">
            {status}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`pt-1 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Share anywhere
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onShare(p.id)}
            className={iconBtnClass(false)}
            title={p.label}
            aria-label={p.label}
          >
            {p.icon}
          </button>
        ))}
        {canNativeShare && (
          <button
            type="button"
            onClick={onNativeShare}
            className={iconBtnClass(true)}
            title="More share options"
            aria-label="Device share"
          >
            <IconDeviceShare />
          </button>
        )}
      </div>
      {status && <p className="mt-2 text-xs text-success">{status}</p>}
    </div>
  );
}

/** Share control for engage bars — icon button + destination menu */
export function ShareMenuButton({
  path,
  title,
  text,
}: {
  path: string;
  title?: string;
  text?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share"
        title="Share"
        className={iconBtnClass(open)}
      >
        <IconShare />
      </button>
      {open ? (
        <div className="absolute left-0 bottom-full z-30 mb-1 sm:bottom-auto sm:top-full sm:mb-0 sm:mt-1">
          <SocialShare
            path={path}
            title={title ?? "Janark"}
            text={text}
            variant="menu"
            onDone={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
