"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { detectMediaType, type MediaType } from "@/lib/media";
import { MediaViewer } from "@/components/MediaViewer";
import { IconAttach, IconGif, IconX } from "@/components/Icons";
import { useAuth } from "@/components/AuthModal";

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** When true, media is required (e.g. memes) */
  required?: boolean;
  label?: string;
  className?: string;
  /** Comments: GIF only — link field stays hidden until the add button is used */
  gifOnly?: boolean;
  /**
   * Optional collapsed “Add attachment” control (default for optional media).
   * Set false to always show the fields (e.g. memes with required).
   */
  collapsed?: boolean;
};

/**
 * Optional attachment for posts: upload a file or paste a public media link.
 * Uploads require phone login and go to /api/upload → /uploads/….
 */
export function MediaAttach({
  value,
  onChange,
  required,
  label = "Attachment",
  className = "",
  gifOnly,
  collapsed,
}: Props) {
  const { ensureAuth } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const useCollapsed = collapsed ?? !required;
  const [open, setOpen] = useState(Boolean(value.trim()) || required);
  const [mode, setMode] = useState<"upload" | "link">(
    value.startsWith("/uploads/") ? "upload" : "link",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value.trim()) setOpen(true);
  }, [value]);

  const mediaType: MediaType | null = useMemo(
    () => (value.trim() ? detectMediaType(value.trim()) : null),
    [value],
  );

  const invalidGif =
    gifOnly && value.trim() && mediaType !== null && mediaType !== "gif";

  async function uploadFile(file: File) {
    setError(null);
    const voterKey = ensureAuth("upload an attachment");
    if (!voterKey) return;

    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onChange(String(data.url ?? ""));
      setMode("upload");
    } catch {
      setError("Network error while uploading");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clear() {
    onChange("");
    setError(null);
    if (!required) setOpen(false);
  }

  if (gifOnly) {
    return (
      <div className={className}>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
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
                  , copy the GIF link, and paste it below — or upload a .gif
                  file.
                </p>
              </div>
              <button
                type="button"
                onClick={clear}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted hover:text-navy"
                aria-label="Cancel GIF"
                title="Cancel"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="border border-line bg-white px-3 py-2 text-sm text-navy hover:border-amber disabled:opacity-60"
              >
                {busy ? "Uploading…" : "Upload GIF"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/gif,.gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f);
                }}
              />
            </div>
            <label className="block">
              <span className="sr-only">GIF link</span>
              <input
                type="url"
                value={value.startsWith("/uploads/") ? "" : value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-amber"
                placeholder="Or paste GIF link (giphy.com, tenor.com, or .gif)"
              />
            </label>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
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

  const panel = (
    <div className="space-y-3 border-l-2 border-amber/40 pl-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy">
            <IconAttach className="h-3.5 w-3.5" />
            {label}
            {required ? "" : " (optional)"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Upload a photo, GIF, or short video from your device, or paste a
            public https link.
          </p>
        </div>
        {!required ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted hover:text-navy"
            aria-label="Remove attachment"
            title="Remove"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={
            mode === "upload"
              ? "border border-navy bg-navy px-3 py-1.5 text-cream"
              : "border border-line bg-white px-3 py-1.5 text-navy"
          }
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={
            mode === "link"
              ? "border border-navy bg-navy px-3 py-1.5 text-cream"
              : "border border-line bg-white px-3 py-1.5 text-navy"
          }
        >
          Paste link
        </button>
      </div>

      {mode === "upload" ? (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
            className="block w-full text-sm text-muted file:mr-3 file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:text-navy hover:file:border-amber"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadFile(f);
            }}
          />
          <p className="text-xs text-muted">
            JPEG, PNG, WebP, GIF, MP4, or WebM · max 8 MB. Phone login required
            to upload.
          </p>
          {busy ? <p className="text-xs text-navy">Uploading…</p> : null}
        </div>
      ) : (
        <label className="block">
          <span className="sr-only">Media link</span>
          <input
            type="url"
            required={required && !value.startsWith("/uploads/")}
            value={value.startsWith("/uploads/") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
            placeholder="https://… .gif · .png · .jpg · .mp4 · .webm"
          />
          <p className="mt-1.5 text-xs text-muted">
            Paste a direct link (Giphy, Imgur, your CDN).
            {mediaType && !value.startsWith("/uploads/") ? (
              <span className="ml-1 text-navy">Detected: {mediaType}</span>
            ) : null}
          </p>
        </label>
      )}

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {value.trim() ? (
        <div className="overflow-hidden">
          <MediaViewer
            url={value.trim()}
            mediaType={mediaType ?? "image"}
            alt="Attachment preview"
            className="max-h-64"
          />
          {value.startsWith("/uploads/") ? (
            <p className="mt-1 text-xs text-muted">Uploaded file attached</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (useCollapsed && !open) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 border border-line bg-white px-3 py-2 text-sm text-navy hover:border-amber"
        >
          <IconAttach className="h-4 w-4" />
          Add attachment
        </button>
      </div>
    );
  }

  return <div className={className}>{panel}</div>;
}
