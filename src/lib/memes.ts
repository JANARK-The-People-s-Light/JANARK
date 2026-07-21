/** Normalize and validate meme hashtags / media links */

export function normalizeHashtag(raw: string): string | null {
  const t = raw
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (t.length < 2 || t.length > 40) return null;
  return t;
}

export function parseHashtags(input: unknown): string[] {
  const parts: string[] = [];
  if (Array.isArray(input)) {
    for (const p of input) parts.push(String(p));
  } else if (typeof input === "string") {
    parts.push(
      ...input.split(/[\s,]+/).filter(Boolean),
    );
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const n = normalizeHashtag(p);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out.slice(0, 12);
}

export function isValidMediaUrl(url: string): boolean {
  try {
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
