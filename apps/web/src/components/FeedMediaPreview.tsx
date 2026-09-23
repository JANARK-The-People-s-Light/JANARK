"use client";

import { useState } from "react";

/** Feed media with optional sensitive blur (Settings → Feed & content). */
export function FeedMediaPreview({
  mediaUrl,
  mediaType,
  blur,
}: {
  mediaUrl: string;
  mediaType?: string | null;
  blur?: boolean;
}) {
  const [revealed, setRevealed] = useState(!blur);
  const soft = blur && !revealed;

  return (
    <div
      className="relative mt-5 max-w-lg overflow-hidden rounded-2xl bg-sand/40"
      onClick={(e) => e.preventDefault()}
    >
      {mediaType === "video" ? (
        <video
          src={mediaUrl}
          controls={revealed}
          playsInline
          preload="metadata"
          className={`max-h-64 w-full object-contain transition ${soft ? "scale-105 blur-xl" : ""}`}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt=""
          className={`max-h-64 w-full object-contain transition ${soft ? "scale-105 blur-xl" : ""}`}
          loading="lazy"
        />
      )}
      {soft ? (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center bg-chrome/40 text-sm font-medium text-on-chrome"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setRevealed(true);
          }}
        >
          Sensitive media — tap to reveal
        </button>
      ) : null}
    </div>
  );
}
