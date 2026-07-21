import { isValidMediaUrl } from "@/lib/memes";

export type MediaType = "image" | "gif" | "video";

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;
const GIF_EXT = /\.gif(\?|#|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|bmp|svg)(\?|#|$)/i;

/** Infer media kind from URL path / known hosts */
export function detectMediaType(url: string): MediaType {
  const lower = url.toLowerCase();
  if (VIDEO_EXT.test(lower)) return "video";
  if (GIF_EXT.test(lower)) return "gif";
  if (
    lower.includes("giphy.com") ||
    lower.includes("tenor.com") ||
    lower.includes("media.giphy")
  ) {
    // Giphy/Tenor often serve animated GIFs without .gif in the final path
    if (VIDEO_EXT.test(lower) || lower.includes("/mp4") || lower.includes(".mp4")) {
      return "video";
    }
    return "gif";
  }
  if (IMAGE_EXT.test(lower)) return "image";
  // Default: treat as image (most CDN share links)
  return "image";
}

export function parseOptionalMedia(
  body: Record<string, unknown>,
  opts?: { allow?: MediaType[] },
): {
  mediaUrl: string | null;
  mediaType: MediaType | null;
  error?: string;
} {
  const raw =
    typeof body.mediaUrl === "string"
      ? body.mediaUrl.trim()
      : typeof body.imageUrl === "string"
        ? body.imageUrl.trim()
        : "";

  if (!raw) return { mediaUrl: null, mediaType: null };

  if (!isValidMediaUrl(raw)) {
    return {
      mediaUrl: null,
      mediaType: null,
      error: "Media must be a valid http(s) link to an image, GIF, or video",
    };
  }

  const forced =
    body.mediaType === "image" ||
    body.mediaType === "gif" ||
    body.mediaType === "video"
      ? (body.mediaType as MediaType)
      : null;

  const mediaType = forced ?? detectMediaType(raw);

  if (opts?.allow && opts.allow.length > 0 && !opts.allow.includes(mediaType)) {
    const allowed = opts.allow.join(", ");
    return {
      mediaUrl: null,
      mediaType: null,
      error:
        opts.allow.length === 1 && opts.allow[0] === "gif"
          ? "Comments only allow GIF links (Giphy, Tenor, or a direct .gif URL)"
          : `Only these media types are allowed: ${allowed}`,
    };
  }

  return {
    mediaUrl: raw,
    mediaType,
  };
}

export { isValidMediaUrl };
