import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { assertSameOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Clear httpOnly session cookie and revoke server session */
export async function POST(req: Request) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  await destroySession(res);
  return res;
}
