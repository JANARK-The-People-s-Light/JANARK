import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guardAnonymousWrite, turnstileConfigured } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { generateAnonId } from "@/lib/identity";
import {
  hashOtp,
  hashPhone,
  normalizePhone,
  phoneHint,
  safeEqualHash,
} from "@/lib/phone";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const MAX_OTP_ATTEMPTS = 5;

/** Confirm OTP → httpOnly session cookie + public anon profile fields */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "otp-verify",
    body,
    req,
    phoneRequired: false,
    requireTurnstile: turnstileConfigured(),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const normalized = normalizePhone(String(body.phone ?? ""));
  const code = String(body.code ?? "").trim();

  if (!normalized || code.length !== 6) {
    return NextResponse.json(
      { error: "Phone and 6-digit OTP required" },
      { status: 400 },
    );
  }

  const phoneHash = hashPhone(normalized);
  const { assertRateLimit } = await import("@/lib/anti-bot");

  const otp = await prisma.phoneOtp.findFirst({
    where: {
      phoneHash,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    await assertRateLimit(`otp-verify-fail:${phoneHash}`, 15, 60 * 60 * 1000);
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 401 },
    );
  }

  if (otp.failedAttempts >= MAX_OTP_ATTEMPTS) {
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { consumed: true },
    });
    return NextResponse.json(
      { error: "Too many incorrect attempts — request a new OTP" },
      { status: 429 },
    );
  }

  if (!safeEqualHash(otp.codeHash, hashOtp(code, phoneHash))) {
    const failRl = await assertRateLimit(
      `otp-verify-fail:${phoneHash}`,
      15,
      60 * 60 * 1000,
    );
    if (!failRl.ok) return guardFail(failRl);

    const updated = await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { failedAttempts: { increment: 1 } },
    });
    if (updated.failedAttempts >= MAX_OTP_ATTEMPTS) {
      await prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { consumed: true },
      });
    }
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 401 },
    );
  }

  await prisma.phoneOtp.update({
    where: { id: otp.id },
    data: { consumed: true },
  });

  // Consume any other outstanding OTPs for this phone
  await prisma.phoneOtp.updateMany({
    where: { phoneHash, consumed: false },
    data: { consumed: true },
  });

  const hint = phoneHint(normalized);
  const existing = await prisma.phoneIdentity.findUnique({
    where: { phoneHash },
  });

  let identity = existing;
  if (existing) {
    identity = await prisma.phoneIdentity.update({
      where: { phoneHash },
      data: {
        lastSeenAt: new Date(),
        phoneHint: hint,
        ...(!existing.anonId ? { anonId: generateAnonId() } : {}),
      },
    });
  } else {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        identity = await prisma.phoneIdentity.create({
          data: {
            phoneHash,
            phoneHint: hint,
            anonId: generateAnonId(),
          },
        });
        break;
      } catch {
        // anonId unique collision
      }
    }
  }

  if (!identity?.anonId) {
    return NextResponse.json(
      { error: "Could not create anonymous identity" },
      { status: 500 },
    );
  }

  // Revoke older sessions for this phone (single active session)
  await prisma.authSession.updateMany({
    where: { phoneHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const res = NextResponse.json({
    ok: true,
    session: {
      // Never return phoneHash to the browser
      hint: identity.phoneHint,
      anonId: identity.anonId,
      anonymous: true,
      authenticated: true,
    },
    message:
      "Phone verified anonymously. Your anonymity ID is public; your number is never shown.",
  });

  await createSession(phoneHash, res);
  return res;
}
