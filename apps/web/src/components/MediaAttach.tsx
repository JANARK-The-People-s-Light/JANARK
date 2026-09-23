"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function clipboardImageFile(
  data: DataTransfer | null,
  gifOnly?: boolean,
): File | null {
  if (!data) return null;

  const fromFiles = Array.from(data.files || []).find((f) =>
    gifOnly
      ? f.type === "image/gif" || /\.gif$/i.test(f.name)
      : f.type.startsWith("image/") || f.type.startsWith("video/"),
  );
  if (fromFiles) return fromFiles;

  for (const item of Array.from(data.items || [])) {
    if (item.kind !== "file") continue;
    const type = (item.type || "").toLowerCase();
    if (gifOnly) {
      if (type !== "image/gif") continue;
    } else if (!type.startsWith("image/") && !type.startsWith("video/")) {
      continue;
    }
    const file = item.getAsFile();
    if (file) return file;
  }
  return null;
}

/**
 * Optional attachment for posts: upload a file, paste from clipboard, or paste a public media link.
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
  const rootRef = useRef<HTMLDivElement>(null);
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

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      if (gifOnly) {
        const ok =
          file.type === "image/gif" || /\.gif$/i.test(file.name || "");
        if (!ok) {
          setError("Comments only support GIF images — paste or upload a .gif");
          setOpen(true);
          return;
        }
      }

      const voterKey = ensureAuth("upload an attachment");
      if (!voterKey) return;

      setOpen(true);
      setBusy(true);
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
          setError("Upload failed");
          return;
        }
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
    },
    [ensureAuth, gifOnly, onChange],
  );

  // Paste image/GIF from clipboard while focus is in the same form (or this control).
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = clipboardImageFile(e.clipboardData, gifOnly);
      if (!file) return;

      const root = rootRef.current;
      if (!root) return;
      const scope = root.closest("form") ?? root;
      const active = document.activeElement;
      if (
        active &&
        active !== document.body &&
        !scope.contains(active) &&
        active !== root
      ) {
        return;
      }

      // Prefer not to steal plain-text pastes into text fields when no image file
      // (clipboardImageFile already requires a file). Always take image pastes.
      e.preventDefault();
      void uploadFile(file);
    }

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [gifOnly, uploadFile]);

  function clear() {
    onChange("");
    setError(null);
    if (!required) setOpen(false);
  }

  if (gifOnly) {
    return (
      <div ref={rootRef} className={className}>
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
                  Paste a GIF (⌘/Ctrl+V), upload a .gif, or paste a Giphy/Tenor
                  link.{" "}
                  <a
                    href="https://giphy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:underline"
                  >
                    Giphy
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://tenor.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:underline"
                  >
                    Tenor
                  </a>
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
            Paste an image (⌘/Ctrl+V), upload a file, or paste a public https
            link.
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
              ? "border border-navy bg-chrome px-3 py-1.5 text-on-chrome"
              : "border border-line bg-white px-3 py-1.5 text-navy"
          }
        >
          Upload / paste
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={
            mode === "link"
              ? "border border-navy bg-chrome px-3 py-1.5 text-on-chrome"
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
            JPEG, PNG, WebP, GIF, MP4, or WebM · max 8 MB. Paste from clipboard
            or choose a file. Phone login required to upload.
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
            Paste a direct link (Giphy, Imgur, your CDN). You can also paste an
            image file with ⌘/Ctrl+V.
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
      <div ref={rootRef} className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 border border-line bg-white px-3 py-2 text-sm text-navy hover:border-amber"
        >
          <IconAttach className="h-4 w-4" />
          Add attachment
        </button>
        <p className="mt-1.5 text-xs text-muted">
          Or paste an image anywhere in this form (⌘/Ctrl+V)
        </p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={className}>
      {panel}
    </div>
  );
}
