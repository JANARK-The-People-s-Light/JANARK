"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** Cloudflare Turnstile widget — only mounts when site key is configured */
export function TurnstileField({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) {
      onToken(null);
      return;
    }

    let cancelled = false;

    function mount() {
      if (cancelled || !ref.current || !window.turnstile) return;
      if (widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        theme: "light",
      });
      setReady(true);
    }

    const existing = document.querySelector(
      'script[data-janark-turnstile="1"]',
    ) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) mount();
      else existing.addEventListener("load", mount);
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.dataset.janarkTurnstile = "1";
    script.addEventListener("load", mount);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [onToken]);

  if (!SITE_KEY) return null;

  return (
    <div className="min-h-[65px]">
      <div ref={ref} />
      {!ready && (
        <p className="text-xs text-muted">Loading human verification…</p>
      )}
    </div>
  );
}

export function turnstileEnabledClient() {
  return Boolean(SITE_KEY);
}
