"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/AuthModal";
import { IconFlag, IconX } from "@/components/Icons";

const REASONS = [
  { id: "spam", label: "Spam or scam" },
  { id: "harassment", label: "Harassment or hate" },
  { id: "misinformation", label: "Misinformation" },
  { id: "doxxing", label: "Personal info / doxxing" },
  { id: "illegal", label: "Illegal content" },
  { id: "unrelated", label: "Unrelated to this platform" },
  { id: "other", label: "Other" },
] as const;

type Props = {
  targetType: string;
  targetId: string;
  /** Optional label for the popup title */
  label?: string;
  className?: string;
};

/**
 * Small report/flag control. Opens a modal to submit an anonymous content report.
 */
export function ReportButton({
  targetType,
  targetId,
  label = "this content",
  className = "",
}: Props) {
  const { ensureAuth } = useAuth();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState<string>("spam");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openModal() {
    setError(null);
    setDone(false);
    setReason("spam");
    setDetail("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const voterKey = ensureAuth("report this content");
    if (!voterKey) return;
    setBusy(true);
    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          detail: detail.trim() || undefined,
          voterKey,
          website: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit report");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-4"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="max-h-[90dvh] w-full max-w-md overflow-y-auto border border-line bg-white p-5 shadow-lg sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">
                    Report
                  </p>
                  <h2
                    id={titleId}
                    className="font-display mt-1 text-xl text-navy"
                  >
                    Flag {label}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center text-muted transition hover:text-navy"
                  aria-label="Close"
                >
                  <IconX />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">
                Reports are anonymous (phone hash only). We review abuse,
                doxxing, and illegal content.
              </p>

              {done ? (
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-success">
                    Thanks — your report was recorded anonymously.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-mid"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-5 space-y-4">
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Reason
                    </legend>
                    {REASONS.map((r) => (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-navy"
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.id}
                          checked={reason === r.id}
                          onChange={() => setReason(r.id)}
                          className="accent-amber"
                        />
                        {r.label}
                      </label>
                    ))}
                  </fieldset>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Details (optional)
                    </span>
                    <textarea
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Anything moderators should know…"
                      className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-amber"
                    />
                  </label>
                  {error && <p className="text-sm text-danger">{error}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={busy}
                      className="bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-mid disabled:opacity-60"
                    >
                      {busy ? "Sending…" : "Submit report"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-2 py-2 text-sm text-muted hover:text-navy"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        title="Report"
        aria-label={`Report ${label}`}
        className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm text-muted transition hover:text-danger ${className}`}
      >
        <IconFlag />
      </button>
      {modal}
    </>
  );
}
