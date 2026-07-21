import { isProductionRuntime } from "@/lib/security-env";

/**
 * Same-origin check for browser mutating requests.
 * Allows missing Origin on same-site navigations that only send Referer,
 * and non-browser clients without Origin when not in production.
 */
export function assertSameOrigin(req: Request): { ok: true } | { ok: false; error: string } {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!isProductionRuntime()) {
    // Dev: allow localhost variants
    if (!origin && !referer) return { ok: true };
    const allowed = new Set<string>();
    if (site) allowed.add(site);
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
    if (origin && [...allowed].some((a) => origin === a || origin.startsWith(a))) {
      return { ok: true };
    }
    if (!origin) return { ok: true };
    return { ok: false, error: "Invalid request origin" };
  }

  if (!site) {
    return { ok: false, error: "Server misconfigured (SITE_URL)" };
  }

  if (origin) {
    if (origin.replace(/\/$/, "") === site) return { ok: true };
    return { ok: false, error: "Invalid request origin" };
  }

  if (referer) {
    try {
      const ref = new URL(referer);
      if (`${ref.protocol}//${ref.host}` === site) return { ok: true };
    } catch {
      /* ignore */
    }
    return { ok: false, error: "Invalid request origin" };
  }

  // No Origin/Referer in production — reject browser-less CSRF-style posts
  return { ok: false, error: "Missing request origin" };
}
