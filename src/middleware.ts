import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { assertProductionSecurity } from "@/lib/security-env";

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
};

function contentSecurityPolicy(isProd: boolean): string {
  // Allow Cloudflare Turnstile when configured; media from https only
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // Next.js inline scripts / hydration
    "https://challenges.cloudflare.com",
  ];
  if (!isProd) {
    scriptSrc.push("'unsafe-eval'"); // Next dev
  }
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** Security headers + no-store for live civic data. */
export function middleware(_req: NextRequest) {
  try {
    assertProductionSecurity();
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return new NextResponse("Server misconfigured", { status: 503 });
  }

  const res = NextResponse.next();
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
