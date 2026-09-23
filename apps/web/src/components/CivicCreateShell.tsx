"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { IconDown } from "@/components/Icons";
import { portalHref } from "@/lib/paths";

export type CreateInsightItem = {
  label: string;
  value: string;
};

type Props = {
  /** Intent question — the only primary headline */
  intent: string;
  /** Optional quiet supporting line */
  support?: string;
  backHref?: string;
  backLabel?: string;
  error?: string | null;
  onSubmit: (e: FormEvent) => void;
  /** Live preview — only shown after user opts in or has content */
  preview?: ReactNode;
  hasPreviewContent?: boolean;
  /** Tiny live detections under the writing area */
  insights?: CreateInsightItem[];
  acceptedTerms: boolean;
  onAcceptedChange: (v: boolean) => void;
  termsId: string;
  draftNote: string | null;
  onSaveDraft: () => void;
  publishLabel: string;
  publishing: boolean;
  canPublish: boolean;
  children: ReactNode;
};

/**
 * Unified civic composer shell — single column, typography-first, progressive.
 * Preview is optional; chrome stays out of the way.
 */
export function CivicCreateShell({
  intent,
  support,
  backHref,
  backLabel = "Back",
  error,
  onSubmit,
  preview,
  hasPreviewContent = false,
  insights = [],
  acceptedTerms,
  onAcceptedChange,
  termsId,
  draftNote,
  onSaveDraft,
  publishLabel,
  publishing,
  canPublish,
  children,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(true);

  useEffect(() => {
    if (hasPreviewContent && previewOpen === false) {
      // Soft reveal once — don't force open every keystroke after close
    }
  }, [hasPreviewContent, previewOpen]);

  useEffect(() => {
    let lastY = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      const goingDown = y > lastY && y > 80;
      setFooterVisible(!goingDown);
      lastY = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const busyLabel = publishLabel.toLowerCase().startsWith("launch")
    ? "Launching…"
    : "Publishing…";

  return (
    <div className="compose-focus relative min-h-[calc(100vh-3.5rem)]">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-[40rem] px-5 pb-36 pt-8 sm:px-8 sm:pt-12"
      >
        {backHref ? (
          <Link
            href={backHref}
            className="text-sm text-muted transition hover:text-navy"
          >
            ← {backLabel}
          </Link>
        ) : null}

        <h1 className="font-display mt-6 text-[1.65rem] leading-snug tracking-tight text-navy sm:text-3xl">
          {intent}
        </h1>
        {support ? (
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
            {support}
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-10">{children}</div>

        {insights.length > 0 ? (
          <ul className="mt-10 space-y-2.5 border-t border-transparent pt-2">
            {insights.map((item) => (
              <li
                key={`${item.label}-${item.value}`}
                className="flex flex-wrap items-baseline gap-x-2 text-sm text-navy/80 animate-[fadeIn_0.35s_ease]"
              >
                <span className="text-link" aria-hidden>
                  ✓
                </span>
                <span className="text-muted">{item.label}</span>
                <span className="font-medium text-navy">{item.value}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {preview && hasPreviewContent ? (
          <div className="mt-10">
            <button
              type="button"
              onClick={() => setPreviewOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-navy"
              aria-expanded={previewOpen}
            >
              {previewOpen ? "Hide preview" : "Preview"}
              <IconDown
                className={`h-3.5 w-3.5 transition ${
                  previewOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {previewOpen ? (
              <div className="mt-4 rounded-2xl bg-sand/35 px-5 py-5 text-navy animate-[fadeIn_0.3s_ease]">
                {preview}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Inline publish — not a Word-style legal bar */}
        <div className="mt-14 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={publishing || !canPublish}
              className="rounded-full bg-chrome px-6 py-3 text-sm font-semibold text-on-chrome transition hover:bg-chrome/90 disabled:opacity-40"
            >
              {publishing ? busyLabel : publishLabel}
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              className="text-sm text-muted transition hover:text-navy"
            >
              Save draft
            </button>
            {draftNote ? (
              <span className="text-xs text-muted">{draftNote}</span>
            ) : null}
          </div>

          {!acceptedTerms ? (
            <label
              htmlFor={termsId}
              className="flex max-w-md cursor-pointer items-start gap-2.5 text-sm text-navy/80"
            >
              <input
                id={termsId}
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => onAcceptedChange(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-amber"
              />
              <span>
                I agree to the{" "}
                <Link
                  href={portalHref("/terms")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link underline-offset-2 hover:underline"
                >
                  Civic Posting Terms
                </Link>
              </span>
            </label>
          ) : (
            <p className="max-w-md text-xs leading-relaxed text-muted">
              By publishing you agree to the{" "}
              <Link
                href={portalHref("/terms")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link underline-offset-2 hover:underline"
              >
                Civic Posting Terms
              </Link>
              .
            </p>
          )}
        </div>
      </form>

      {/* Mobile sticky publish — hides while scrolling down */}
      <div
        className={`fixed inset-x-0 bottom-[env(safe-area-inset-bottom,0px)] z-30 border-t border-line/60 bg-cream/90 px-4 py-3 backdrop-blur transition duration-300 lg:hidden ${
          footerVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <button
          type="submit"
          form=""
          disabled={publishing || !canPublish}
          onClick={(e) => {
            e.preventDefault();
            const form = document.querySelector(
              ".compose-focus form",
            ) as HTMLFormElement | null;
            form?.requestSubmit();
          }}
          className="w-full rounded-full bg-chrome py-3 text-sm font-semibold text-on-chrome disabled:opacity-40"
        >
          {publishing ? busyLabel : publishLabel}
        </button>
      </div>
    </div>
  );
}

/** Soft vertical rhythm — prefer spacing over hairline rules. */
export function CreateSpacer({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = size === "sm" ? "h-6" : size === "lg" ? "h-14" : "h-10";
  return <div className={h} aria-hidden />;
}

/** Collapsed “more” block — progressive disclosure. */
export function CreateMore({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between gap-3 py-2 text-left"
        aria-expanded={open}
      >
        <span className="text-sm text-muted transition group-hover:text-navy">
          {summary}
        </span>
        <IconDown
          className={`h-3.5 w-3.5 text-muted transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? <div className="mt-4 space-y-6">{children}</div> : null}
    </div>
  );
}

export function CreateDivider() {
  return <CreateSpacer size="lg" />;
}

/** Borderless primary title field */
export const createTitleClass =
  "mt-3 w-full resize-none bg-transparent text-[1.35rem] leading-snug text-navy outline-none placeholder:text-navy/20 sm:text-2xl";

/** Borderless body field */
export const createBodyClass =
  "mt-3 w-full resize-none bg-transparent text-[15px] leading-relaxed text-navy/90 outline-none placeholder:text-navy/25";

/** Quiet underline control for selects/inputs in More */
export const createQuietInputClass =
  "mt-2 w-full appearance-none border-0 border-b border-line/70 bg-transparent py-2 text-sm text-navy outline-none transition focus:border-amber";
