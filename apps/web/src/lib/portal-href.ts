/**
 * Client helpers for portal URL search updates.
 * Soft-nav that only drops the query often no-ops under App Router +
 * `/unreleased` middleware rewrites (pathname unchanged). Clearing uses a
 * real navigation so `useSearchParams` stays in sync with the address bar.
 */

export function portalBrowserPath(fallbackPathname: string): string {
  if (typeof window !== "undefined") return window.location.pathname;
  return fallbackPathname;
}

export function portalHrefWithSearch(
  fallbackPathname: string,
  params: URLSearchParams,
): string {
  const path = portalBrowserPath(fallbackPathname);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

type PortalRouter = {
  replace: (href: string, opts?: { scroll?: boolean }) => void;
};

/** True when href has no meaningful query string (bare path or empty `?`). */
function isBarePath(href: string): boolean {
  const q = href.indexOf("?");
  const hash = href.indexOf("#");
  if (q === -1) return true;
  if (hash !== -1 && hash < q) return true;
  const search =
    hash === -1 ? href.slice(q + 1) : href.slice(q + 1, hash);
  return search.length === 0;
}

export function replacePortalHref(router: PortalRouter, href: string): void {
  const clearingSearch =
    typeof window !== "undefined" &&
    Boolean(window.location.search) &&
    isBarePath(href);

  if (clearingSearch) {
    window.location.replace(href);
    return;
  }

  router.replace(href, { scroll: false });
}
