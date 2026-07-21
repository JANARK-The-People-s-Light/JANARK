import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { prisma } from "@/lib/db";
import { assertSameOrigin } from "@/lib/origin";
import { resolveSessionFromRequest } from "@/lib/session";

const TOKEN_SECRET =
  process.env.HUMAN_TOKEN_SECRET ||
  process.env.PHONE_HASH_SALT ||
  "janark-dev-human-secret";
const IP_SALT =
  process.env.IP_HASH_SALT ||
  process.env.PHONE_HASH_SALT ||
  "janark-dev-ip-salt";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "";
const TOKEN_TTL_MS = 45 * 60 * 1000; // 45 minutes

export type GuardFail = {
  ok: false;
  status: number;
  error: string;
};

export type GuardOk = { ok: true; voterKey?: string };

function b64url(buf: Buffer | string) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

/** One-way client fingerprint — never store raw IP */
export function hashClientFingerprint(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  const ua = req.headers.get("user-agent") ?? "";
  const raw = `${fwd || real || "local"}|${ua.slice(0, 120)}`;
  return createHash("sha256").update(`${IP_SALT}:${raw}`).digest("hex");
}

export function issueHumanToken(): string {
  const payload = {
    n: randomBytes(8).toString("hex"),
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    createHmac("sha256", TOKEN_SECRET).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export function verifyHumanToken(token: unknown): boolean {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = b64url(
    createHmac("sha256", TOKEN_SECRET).update(body).digest(),
  );
  try {
    const a = fromB64url(sig);
    const b = fromB64url(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as {
      exp?: number;
    };
    if (!payload.exp || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

/** Honeypot: bots fill hidden fields; humans leave them empty */
export function honeypotTripped(body: Record<string, unknown>): boolean {
  const traps = [body.website, body._hp, body.company, body.fax];
  return traps.some((v) => typeof v === "string" && v.trim().length > 0);
}

export async function verifyTurnstile(
  token: string,
  req: Request,
): Promise<boolean> {
  if (!TURNSTILE_SECRET) return false;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;
  const form = new URLSearchParams();
  form.set("secret", TURNSTILE_SECRET);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );
  const data = (await res.json()) as { success?: boolean };
  return !!data.success;
}

/**
 * Rate limit by anonymous bucket key (hashed). Sliding fixed window in SQLite.
 * Returns remaining OK, or fail with 429.
 */
export async function assertRateLimit(
  bucketKey: string,
  limit: number,
  windowMs: number,
): Promise<GuardOk | GuardFail> {
  const id = createHash("sha256")
    .update(`rl:${bucketKey}`)
    .digest("hex")
    .slice(0, 40);
  const now = new Date();
  const existing = await prisma.rateLimitBucket.findUnique({ where: { id } });

  if (!existing || now.getTime() - existing.windowStart.getTime() > windowMs) {
    await prisma.rateLimitBucket.upsert({
      where: { id },
      create: { id, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      status: 429,
      error: "Too many attempts — slow down and try again later",
    };
  }

  await prisma.rateLimitBucket.update({
    where: { id },
    data: { count: { increment: 1 } },
  });
  return { ok: true };
}

/** Phone hash must exist — proves OTP verification; number never public */
export async function assertAnonymousPhone(
  voterKey: unknown,
): Promise<GuardOk | GuardFail> {
  const key = typeof voterKey === "string" ? voterKey.trim() : "";
  if (!key || key.length < 32) {
    return {
      ok: false,
      status: 401,
      error: "Verify your phone number to continue (anonymous — number never shown)",
    };
  }
  const identity = await prisma.phoneIdentity.findUnique({
    where: { phoneHash: key },
  });
  if (!identity) {
    return {
      ok: false,
      status: 401,
      error: "Verify your phone number to continue (anonymous — number never shown)",
    };
  }
  await prisma.phoneIdentity.update({
    where: { phoneHash: key },
    data: { lastSeenAt: new Date() },
  });
  return { ok: true };
}

type WriteGuardOpts = {
  action: string;
  body: Record<string, unknown>;
  req: Request;
  /** Require phone OTP identity (hash only) */
  phoneRequired?: boolean;
  /** Require Cloudflare Turnstile when configured */
  requireTurnstile?: boolean;
  limit?: number;
  windowMs?: number;
  /** Skip Origin check (rare; prefer keeping it on) */
  skipOriginCheck?: boolean;
};

/**
 * Shared write guard: origin → honeypot → turnstile → rate limit → session cookie.
 * Client-supplied voterKey is ignored; identity comes from the httpOnly session.
 * Never logs phone numbers or raw IPs.
 */
export async function guardAnonymousWrite(
  opts: WriteGuardOpts,
): Promise<GuardOk | GuardFail> {
  const { body, req, action } = opts;
  const phoneRequired = opts.phoneRequired !== false;

  if (!opts.skipOriginCheck) {
    const origin = assertSameOrigin(req);
    if (!origin.ok) {
      return { ok: false, status: 403, error: origin.error };
    }
  }

  if (honeypotTripped(body)) {
    return { ok: false, status: 400, error: "Rejected" };
  }

  if (opts.requireTurnstile && turnstileConfigured()) {
    const token =
      typeof body.turnstileToken === "string"
        ? body.turnstileToken
        : typeof body.cfTurnstileResponse === "string"
          ? body.cfTurnstileResponse
          : "";
    if (!token || !(await verifyTurnstile(token, req))) {
      return {
        ok: false,
        status: 403,
        error: "Human verification failed — refresh and try again",
      };
    }
  }

  const session = await resolveSessionFromRequest(req);
  const phoneHash = session?.phoneHash ?? null;

  // Never trust client voterKey as auth — bind from session when present
  if (phoneHash) {
    body.voterKey = phoneHash;
  } else if (phoneRequired) {
    // Strip any forged client hash so downstream cannot misuse it
    delete body.voterKey;
  }

  const fp = hashClientFingerprint(req);
  const phonePart = phoneHash ? phoneHash.slice(0, 16) : "anon";
  const rl = await assertRateLimit(
    `${action}:${fp}:${phonePart}`,
    opts.limit ?? 30,
    opts.windowMs ?? 60 * 60 * 1000,
  );
  if (!rl.ok) return rl;

  if (phoneRequired) {
    if (!phoneHash) {
      return {
        ok: false,
        status: 401,
        error:
          "Verify your phone number to continue (anonymous — number never shown)",
      };
    }
    const phone = await assertAnonymousPhone(phoneHash);
    if (!phone.ok) return phone;
    return { ok: true, voterKey: phoneHash };
  }

  return { ok: true, voterKey: phoneHash ?? undefined };
}

export function turnstileConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && TURNSTILE_SECRET,
  );
}
