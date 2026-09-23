import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PORTAL_BASE,
  isPortalAppPath,
  stripPortalBase,
} from "@/lib/paths";
import { assertProductionSecurity } from "@/lib/security-env";

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
};

function contentSecurityPolicy(isProd: boolean): string {
  // Allow Cloudflare Turnstile when configured; AdSense when monetization is on; media from https only
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // Next.js inline scripts / hydration
    "https://challenges.cloudflare.com",
    "https://pagead2.googlesyndication.com",
    "https://www.googletagservices.com",
    "https://www.google.com",
    "https://partner.googleadservices.com",
  ];
  if (!isProd) {
    scriptSrc.push("'unsafe-eval'"); // Next dev
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const httpsSite = site.startsWith("https://");
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com https://nominatim.openstreetmap.org https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com",
    "frame-src https://challenges.cloudflare.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://pagead2.googlesyndication.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  // Only on real HTTPS hosts — otherwise localhost http:// images/uploads break
  if (isProd && httpsSite) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

function withSecurityHeaders(res: NextResponse) {
  const isProd = process.env.NODE_ENV === "production";
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0",
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  for (const [k, v] of Object.entries(securityHeaders)) {
    res.headers.set(k, v);
  }
  res.headers.set("Content-Security-Policy", contentSecurityPolicy(isProd));
  if (isProd) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return res;
}

/**
 * `/` = public coming soon.
 * `/unreleased` = portal home; `/unreleased/*` rewrites to real app routes.
 * Bare portal paths (e.g. `/feed`) redirect under `/unreleased`.
 */
export function middleware(req: NextRequest) {
  try {
    assertProductionSecurity();
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return new NextResponse("Server misconfigured", { status: 503 });
  }

  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/logo/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/ads.txt"
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Public coming-soon homepage
  if (pathname === "/") {
    return withSecurityHeaders(NextResponse.next());
  }

  // Portal home lives at /unreleased
  if (pathname === PORTAL_BASE || pathname === `${PORTAL_BASE}/`) {
    return withSecurityHeaders(NextResponse.next());
  }

  // /unreleased/feed → internally /feed (URL stays prefixed)
  if (pathname.startsWith(`${PORTAL_BASE}/`)) {
    const url = req.nextUrl.clone();
    url.pathname = stripPortalBase(pathname);
    return withSecurityHeaders(NextResponse.rewrite(url));
  }

  // /feed → /unreleased/feed so bookmarks and old links still work
  if (isPortalAppPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `${PORTAL_BASE}${pathname}`;
    url.search = search;
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
