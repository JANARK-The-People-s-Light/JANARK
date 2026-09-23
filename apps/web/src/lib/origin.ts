import { isProductionRuntime } from "@/lib/security-env";

function loopbackHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h === "10.0.2.2" || // Android emulator → host machine
    h === "10.0.3.2" // Genymotion
  );
}

function defaultPort(protocol: string): string {
  return protocol === "https:" ? "443" : "80";
}

/** True when Origin/Referer matches the configured site, including emulator loopback aliases. */
export function originsCompatible(siteUrl: string, incoming: string): boolean {
  try {
    const site = new URL(siteUrl);
    const other = new URL(incoming);
    if (site.protocol !== other.protocol) return false;
    const sitePort = site.port || defaultPort(site.protocol);
    const otherPort = other.port || defaultPort(other.protocol);
    if (sitePort !== otherPort) return false;
    if (site.hostname === other.hostname) return true;
    // Emulator / local clients hit 10.0.2.2 while SITE_URL is localhost
    if (loopbackHost(site.hostname) && loopbackHost(other.hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

function privateLanHost(host: string): boolean {
  const h = host.toLowerCase();
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/**
 * Same-origin check for browser / native mutating requests.
 * Allows missing Origin on same-site navigations that only send Referer,
 * and non-browser clients without Origin when not in production.
 */
export function assertSameOrigin(req: Request): { ok: true } | { ok: false; error: string } {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!isProductionRuntime()) {
    if (!origin && !referer) return { ok: true };
    const allowed = new Set<string>();
    if (site) allowed.add(site);
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
    allowed.add("http://10.0.2.2:3000");
    allowed.add("http://10.0.3.2:3000");
    if (origin) {
      if ([...allowed].some((a) => originsCompatible(a, origin))) return { ok: true };
      // Physical device on LAN talking to a machine running Next
      try {
        const o = new URL(origin);
        const sitePort = site
          ? new URL(site).port || defaultPort(new URL(site).protocol)
          : "3000";
        const originPort = o.port || defaultPort(o.protocol);
        if (privateLanHost(o.hostname) && originPort === sitePort) return { ok: true };
      } catch {
        /* ignore */
      }
      return { ok: false, error: "Invalid request origin" };
    }
    return { ok: true };
  }

  if (!site) {
    return { ok: false, error: "Server misconfigured (SITE_URL)" };
  }

  if (origin) {
    if (originsCompatible(site, origin)) return { ok: true };
    // Docker/demo: SITE_URL is localhost but phones hit the machine LAN IP
    try {
      const siteUrl = new URL(site);
      const o = new URL(origin);
      if (
        loopbackHost(siteUrl.hostname) &&
        privateLanHost(o.hostname) &&
        siteUrl.protocol === o.protocol &&
        (siteUrl.port || defaultPort(siteUrl.protocol)) ===
          (o.port || defaultPort(o.protocol))
      ) {
        return { ok: true };
      }
    } catch {
      /* ignore */
    }
    return { ok: false, error: "Invalid request origin" };
  }

  if (referer) {
    try {
      const ref = new URL(referer);
      const refOrigin = `${ref.protocol}//${ref.host}`;
      if (originsCompatible(site, refOrigin)) return { ok: true };
    } catch {
      /* ignore */
    }
    return { ok: false, error: "Invalid request origin" };
  }

  return { ok: false, error: "Missing request origin" };
}
