"use client";

import { useEffect, useMemo, useState } from "react";
import { detectMediaType, type MediaType } from "@/lib/media";
import { MediaViewer } from "@/components/MediaViewer";
import { IconGif, IconX } from "@/components/Icons";

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** When true, media is required (e.g. memes) */
  required?: boolean;
  label?: string;
  className?: string;
  /** Comments: GIF only — link field stays hidden until the add button is used */
  gifOnly?: boolean;
};

/**
 * Paste a link to an image, GIF, or video — with live preview.
 * No file upload server yet; uses public https URLs (Giphy, Imgur, CDN, etc.).
 */
export function MediaAttach({
  value,
  onChange,
  required,
  label = "Image / GIF / video link",
  className = "",
  gifOnly,
}: Props) {
  const [linkOpen, setLinkOpen] = useState(Boolean(value.trim()));

  useEffect(() => {
    if (value.trim()) setLinkOpen(true);
  }, [value]);

  const mediaType: MediaType | null = useMemo(
    () => (value.trim() ? detectMediaType(value.trim()) : null),
    [value],
  );

  const invalidGif =
    gifOnly && value.trim() && mediaType !== null && mediaType !== "gif";

  if (gifOnly) {
    return (
      <div className={className}>
        {!linkOpen ? (
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-sm p-1.5 text-sm text-navy/70 hover:text-navy"
          >
            <IconGif />
            Add a GIF
          </button>
        ) : (
          <div className="space-y-2 border-l-2 border-amber/40 pl-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy">
                  <IconGif className="h-3.5 w-3.5" />
                  Add a GIF
                </p>
                <p className="mt-1 text-xs text-muted">
                  Comments only support GIFs. Open{" "}
                  <a
                    href="https://giphy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber hover:underline"
                  >
                    Giphy
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://tenor.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber hover:underline"
                  >
                    Tenor
                  </a>
                  , copy the GIF link, and paste it below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setLinkOpen(false);
                }}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted hover:text-navy"
                aria-label="Cancel GIF"
                title="Cancel"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
            <label className="block">
              <span className="sr-only">GIF link</span>
              <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
                className="w-full border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-amber"
                placeholder="Paste GIF link (giphy.com, tenor.com, or .gif)"
              />
            </label>
            {invalidGif ? (
              <p className="text-xs text-danger">
                That link looks like a {mediaType}, not a GIF. Use a Giphy,
                Tenor, or direct .gif URL.
              </p>
            ) : null}
            {value.trim() && !invalidGif ? (
              <div className="overflow-hidden">
                <MediaViewer
                  url={value.trim()}
                  mediaType="gif"
                  alt="GIF preview"
                  className="max-h-48"
                  compact
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
          {required ? "" : " (optional)"}
        </span>
        <input
          type="url"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
          placeholder="https://… .gif · .png · .jpg · .mp4 · .webm"
        />
      </label>
      <p className="mt-1.5 text-xs text-muted">
        Paste a direct link (Giphy, Imgur, your CDN). Supports images, GIFs, and
        videos.
        {mediaType ? (
          <span className="ml-1 text-navy">Detected: {mediaType}</span>
        ) : null}
      </p>
      {value.trim() && (
        <div className="mt-3 overflow-hidden">
          <MediaViewer
            url={value.trim()}
            mediaType={mediaType ?? "image"}
            alt="Preview"
            className="max-h-64"
          />
        </div>
      )}
    </div>
  );
}
