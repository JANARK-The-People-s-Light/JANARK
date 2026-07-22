/** Meme media helpers — hashtag utils live in `@/lib/hashtags`. */

export {
  normalizeHashtag,
  parseHashtags,
  collectTopicHashtags,
  extractHashtagsFromText,
} from "@/lib/hashtags";

export function isValidMediaUrl(url: string): boolean {
  try {
    // Same-origin citizen uploads
    if (
      url.startsWith("/uploads/") &&
      url.length <= 200 &&
      !url.includes("..") &&
      !url.includes("//")
    ) {
      return /\.(jpe?g|png|webp|gif|mp4|webm)(\?|$)/i.test(url);
    }

    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (url.length > 2000) return false;

    const host = u.hostname.toLowerCase();
    // Block localhost / private / link-local / metadata hosts (SSRF)
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host === "metadata.google.internal" ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      /^169\.254\./.test(host)
    ) {
      return false;
    }

    const path = u.pathname.toLowerCase();
    // SVG can carry script; block as user media
    if (path.endsWith(".svg") || path.includes(".svg?")) return false;

    return true;
  } catch {
    return false;
  }
}

export function publicMeme<T extends { authorHash?: string | null }>(row: T) {
  const { authorHash: _drop, ...rest } = row;
  return rest;
}

export function score(upvotes: number, downvotes: number) {
  return upvotes - downvotes;
}
