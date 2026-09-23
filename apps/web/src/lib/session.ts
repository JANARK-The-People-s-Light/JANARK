import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isProductionRuntime } from "@/lib/security-env";

export const SESSION_COOKIE = "janark_sid";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type ResolvedSession = {
  phoneHash: string;
  sessionId: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function sessionCookieOptions(maxAgeSec = SESSION_TTL_MS / 1000) {
  // Only mark Secure when the public site is HTTPS — Docker/demo often serves
  // http://localhost (and Android emulator uses http://10.0.2.2), where Secure
  // cookies are never sent back by OkHttp / browsers.
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const secure = isProductionRuntime() && site.startsWith("https://");
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeSec),
  };
}

/** Create DB session + set httpOnly cookie on the response */
export async function createSession(
  phoneHash: string,
  res: NextResponse,
): Promise<void> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(token),
      phoneHash,
      expiresAt,
    },
  });

  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
}

/** Revoke session from cookie and clear cookie */
export async function destroySession(res: NextResponse): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession
      .updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => null);
  }
  res.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
}

/** Resolve authenticated phoneHash from the httpOnly session cookie */
export async function resolveSessionFromRequest(
  req: Request,
): Promise<ResolvedSession | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  const token = match?.slice(SESSION_COOKIE.length + 1);
  if (!token || token.length < 32) return null;

  const row = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.revokedAt || row.expiresAt.getTime() < Date.now()) {
    return null;
  }

  // Touch lastSeen (best-effort; ignore races)
  void prisma.authSession
    .update({
      where: { id: row.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => null);

  void prisma.phoneIdentity
    .update({
      where: { phoneHash: row.phoneHash },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => null);

  return { phoneHash: row.phoneHash, sessionId: row.id };
}

/** Cookie-only session lookup via next/headers (for Route Handlers that prefer it) */
export async function resolveSessionFromCookies(): Promise<ResolvedSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 32) return null;

  const row = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.revokedAt || row.expiresAt.getTime() < Date.now()) {
    return null;
  }
  return { phoneHash: row.phoneHash, sessionId: row.id };
}
