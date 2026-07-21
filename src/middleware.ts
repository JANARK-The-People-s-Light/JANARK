import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Force every HTML/API response to stay live (no browser or intermediary cache). */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0",
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and static assets; everything else is dynamic civic data.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
