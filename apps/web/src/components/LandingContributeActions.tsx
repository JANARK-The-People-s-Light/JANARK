"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { fill, publicLink, templates } from "@/lib/config";

type Action = {
  id: string;
  label: string;
  kind?: string;
  linkKey?: string;
  modal?: string;
};

function resolveActionHref(linkKey: string | undefined) {
  if (linkKey === "github" || linkKey === "feedback" || linkKey === "share") {
    return publicLink(linkKey);
  }
  return publicLink("github");
}

export function LandingContributeActions({ actions }: { actions: Action[] }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-2 sm:gap-0">
        {actions.map((action, index) => {
          const isModal = action.kind === "modal";
          const href = isModal ? undefined : resolveActionHref(action.linkKey);
          return (
            <div key={action.id} className="flex items-center">
              {index > 0 ? (
                <>
                  <span
                    className="mx-2 h-3 w-px bg-line sm:hidden"
                    aria-hidden
                  />
                  <span
                    className="mx-3 hidden h-8 w-px bg-line sm:block"
                    aria-hidden
                  />
                </>
              ) : null}
              {isModal ? (
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-link transition hover:bg-sand/60"
                >
                  {action.label}
                </button>
              ) : (
                <a
                  href={href || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-link transition hover:bg-sand/60"
                >
                  {action.label}
                </a>
              )}
            </div>
          );
        })}
      </div>
      {feedbackOpen ? (
        <FeedbackModal onClose={() => setFeedbackOpen(false)} />
      ) : null}
    </>
  );
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const brand = templates.brand();
  const modal = templates.landing().contribute.feedbackModal;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const maxLen = modal.messageMaxLength;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          message,
          email,
          [modal.honeypotField]: "",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        errors?: Record<string, string>;
      };
      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        setError(data.error ?? modal.errorGeneric);
        return;
      }
      setDone(true);
    } catch {
      setError(modal.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return null;

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted/70 focus:border-amber/50 focus:ring-2 focus:ring-amber/20";

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label={modal.cancelLabel}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-background p-5 shadow-2xl sm:p-6"
      >
        {done ? (
          <div className="space-y-4 text-center">
            <h2 id={titleId} className="font-display text-2xl text-navy">
              {modal.successTitle}
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {fill(modal.successBody, { name: brand.name })}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl bg-amber px-5 py-3 text-sm font-semibold text-on-amber transition hover:bg-amber-bright"
            >
              {modal.closeLabel}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <input
              type="text"
              name={modal.honeypotField}
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden
              value=""
              readOnly
            />
            <div>
              <h2 id={titleId} className="font-display text-2xl text-navy">
                {modal.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {modal.intro}
              </p>
            </div>
            <div>
              <label
                htmlFor="landing-feedback-message"
                className="text-sm font-medium text-navy"
              >
                {modal.messageLabel}
                <span className="text-danger" aria-hidden>
                  {" "}
                  *
                </span>
              </label>
              <textarea
                id="landing-feedback-message"
                rows={5}
                maxLength={maxLen}
                required
                className={inputClass}
                placeholder={modal.messagePlaceholder}
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, maxLen))
                }
              />
              <p className="mt-1 text-right text-xs tabular-nums text-muted">
                {message.length} / {maxLen}
              </p>
              {fieldErrors.message ? (
                <p className="mt-1 text-xs text-danger">{fieldErrors.message}</p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="landing-feedback-email"
                className="text-sm font-medium text-navy"
              >
                {modal.emailLabel}
              </label>
              <input
                id="landing-feedback-email"
                type="email"
                autoComplete="email"
                className={inputClass}
                placeholder={modal.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email ? (
                <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>
              ) : null}
            </div>
            {error ? (
              <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-sand/60 hover:text-navy"
              >
                {modal.cancelLabel}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-on-amber transition hover:bg-amber-bright disabled:opacity-60"
              >
                {busy ? modal.submittingLabel : modal.submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
