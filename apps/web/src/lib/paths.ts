/** Public preview of the full portal while the site is in coming-soon mode. */
export const PORTAL_BASE = "/unreleased";

const PORTAL_ROOTS = new Set([
  "explore",
  "memes",
  "demands",
  "petitions",
  "reports",
  "feed",
  "issues",
  "vote",
  "dashboard",
  "about",
  "terms",
  "notice",
  "login",
  "u",
  "p",
  "settings",
  "share",
  "voices",
]);

/** True when the path is part of the civic portal (not the public coming-soon page). */
export function isPortalAppPath(pathname: string): boolean {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  return PORTAL_ROOTS.has(first);
}

/**
 * Prefix internal portal links with `/unreleased` so browsing works while `/` is coming soon.
 * Idempotent; leaves absolute URLs, hashes, APIs, and static assets alone.
 */
export function portalHref(path: string): string {
  const raw = (path || "").trim();
  if (!raw) return PORTAL_BASE;
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:") ||
    raw.startsWith("#") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }
  if (
    raw.startsWith("/api/") ||
    raw.startsWith("/uploads/") ||
    raw.startsWith("/logo/") ||
    raw.startsWith("/_next/")
  ) {
    return raw;
  }

  const [pathnamePart, query = ""] = raw.split("?");
  const pathname = pathnamePart || "/";
  const qs = query ? `?${query}` : "";

  if (pathname === PORTAL_BASE || pathname.startsWith(`${PORTAL_BASE}/`)) {
    return `${pathname}${qs}`;
  }
  if (pathname === "/") {
    return `${PORTAL_BASE}${qs}`;
  }
  return `${PORTAL_BASE}${pathname.startsWith("/") ? pathname : `/${pathname}`}${qs}`;
}

/** Strip `/unreleased` for internal rewrites. */
export function stripPortalBase(pathname: string): string {
  if (pathname === PORTAL_BASE || pathname === `${PORTAL_BASE}/`) return "/";
  if (pathname.startsWith(`${PORTAL_BASE}/`)) {
    const rest = pathname.slice(PORTAL_BASE.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname;
}
