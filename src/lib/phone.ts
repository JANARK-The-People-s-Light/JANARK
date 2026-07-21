import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { isProductionRuntime } from "@/lib/security-env";

function phoneSalt(): string {
  const salt = process.env.PHONE_HASH_SALT || "janark-dev-salt-change-me";
  if (
    isProductionRuntime() &&
    (!process.env.PHONE_HASH_SALT || salt === "janark-dev-salt-change-me")
  ) {
    throw new Error("PHONE_HASH_SALT must be configured in production");
  }
  return salt;
}

/** Normalize Indian / international phone to digits with country code preference */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

export function hashPhone(normalized: string): string {
  return createHash("sha256").update(`${phoneSalt()}:${normalized}`).digest("hex");
}

export function phoneHint(normalized: string): string {
  return `••${normalized.slice(-2)}`;
}

export function hashOtp(code: string, phoneHash: string): string {
  return createHash("sha256")
    .update(`${phoneSalt()}:otp:${phoneHash}:${code}`)
    .digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function safeEqualHash(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Public-safe report DTO — strips authorHash */
export function publicReport<T extends { authorHash?: string | null }>(row: T) {
  const { authorHash: _drop, ...rest } = row;
  return rest;
}
