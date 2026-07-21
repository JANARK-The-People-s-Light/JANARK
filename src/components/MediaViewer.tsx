"use client";

import type { MediaType } from "@/lib/media";
import { detectMediaType } from "@/lib/media";

type Props = {
  url: string;
  mediaType?: MediaType | null;
  alt?: string;
  className?: string;
  /** Smaller presentation inside comments / cards */
  compact?: boolean;
};

export function MediaViewer({
  url,
  mediaType,
  alt = "Attached media",
  className = "",
  compact,
}: Props) {
  const kind = mediaType ?? detectMediaType(url);
  const maxH = compact ? "max-h-48" : className.includes("max-h-") ? "" : "max-h-[28rem]";

  if (kind === "video") {
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className={`w-full bg-sand object-contain ${maxH} ${className}`}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open video
        </a>
      </video>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={`w-full bg-sand object-contain ${maxH} ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        el.style.display = "none";
      }}
    />
  );
}
