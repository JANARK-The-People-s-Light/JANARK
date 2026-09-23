"use client";

import { useState } from "react";
import {
  CIVIC_POST_TERMS_SECTIONS,
  CIVIC_POST_TERMS_TITLE,
  CIVIC_POST_TERMS_VERSION,
} from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

type Props = {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  className?: string;
  /** Compact layout for comments / tight forms */
  compact?: boolean;
};

/**
 * Required T&C acceptance. Full text stays hidden until the user opens it.
 */
export function PostTermsAccept({
  accepted,
  onAcceptedChange,
  className = "",
  compact,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-muted">
          Civic posting terms
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-link hover:underline"
          aria-expanded={open}
        >
          {open ? "Hide full terms" : "Read full terms"}
        </button>
      </div>

      {open && (
        <div
          className={`max-h-64 overflow-y-auto border-l-2 border-amber/40 pl-3 text-sm text-navy ${
            compact ? "" : "sm:max-h-80"
          }`}
          role="region"
          aria-label={CIVIC_POST_TERMS_TITLE}
        >
          <p className="font-display text-base text-navy">
            {CIVIC_POST_TERMS_TITLE}
          </p>
          <p className="mt-1 text-xs text-muted">
            Version {CIVIC_POST_TERMS_VERSION}
          </p>
          <div className="mt-4 space-y-4">
            {CIVIC_POST_TERMS_SECTIONS.map((section) => (
              <section key={section.heading}>
                <h3 className="font-semibold text-navy">{section.heading}</h3>
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)} className="mt-1.5 text-muted">
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                    {section.bullets.map((b) => (
                      <li key={b.slice(0, 48)}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-navy">
        <input
          type="checkbox"
          required
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-amber"
        />
        <span>
          I agree to the{" "}
          <a
            href={portalHref("/terms")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-link underline-offset-2 hover:underline"
          >
            Civic Posting Terms (full page)
          </a>
        </span>
      </label>
    </div>
  );
}
