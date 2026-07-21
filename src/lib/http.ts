import { NextResponse } from "next/server";
import type { GuardFail } from "@/lib/anti-bot";

const LIVE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export function guardFail(g: GuardFail) {
  return NextResponse.json(
    { error: g.error },
    { status: g.status, headers: LIVE },
  );
}

/** JSON response that must never be cached (live civic data). */
export function liveJson(
  data: unknown,
  init?: { status?: number; headers?: HeadersInit },
) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { ...LIVE, ...(init?.headers ?? {}) },
  });
}
