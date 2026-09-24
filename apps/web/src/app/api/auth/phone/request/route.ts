import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  assertRateLimit,
  guardAnonymousWrite,
  hashClientFingerprint,
  turnstileConfigured,
} from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import {
  generateOtp,
  hashOtp,
  hashPhone,
  normalizePhone,
  phoneHint,
} from "@/lib/phone";
import { allowDevOtpInResponse } from "@/lib/security-env";
import { sendOtpSms, smsConfigured } from "@/lib/sms";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * Request OTP — phone number is the verification channel.
 * Only a hash of the number is retained. Rate-limited against bots.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "otp-request",
    body,
    req,
    phoneRequired: false,
    requireTurnstile: turnstileConfigured(),
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const normalized = normalizePhone(String(body.phone ?? ""));
  if (!normalized) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit mobile number" },
      { status: 400 },
    );
  }

  const phoneHash = hashPhone(normalized);
  const phoneRl = await assertRateLimit(
    `otp-phone:${phoneHash}`,
    5,
    60 * 60 * 1000,
  );
  if (!phoneRl.ok) return guardFail(phoneRl);

  const fpRl = await assertRateLimit(
    `otp-fp:${hashClientFingerprint(req)}`,
    12,
    60 * 60 * 1000,
  );
  if (!fpRl.ok) return guardFail(fpRl);

  if (
    process.env.NODE_ENV === "production" &&
    !smsConfigured() &&
    process.env.ALLOW_OTP_WITHOUT_SMS !== "1"
  ) {
    return NextResponse.json(
      { error: "OTP delivery is temporarily unavailable" },
      { status: 503 },
    );
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Invalidate any unused OTPs for this phone
  await prisma.phoneOtp.updateMany({
    where: { phoneHash, consumed: false },
    data: { consumed: true },
  });

  await prisma.phoneOtp.create({
    data: {
      phoneHash,
      codeHash: hashOtp(code, phoneHash),
      expiresAt,
    },
  });

  const sms = await sendOtpSms(normalized, code);
  if (!sms.ok) {
    return NextResponse.json(
      { error: "Could not send OTP — try again shortly" },
      { status: 503 },
    );
  }

  const { trackInteraction } = await import("@/lib/interactions");
  trackInteraction({
    name: "auth.otp_request",
    req,
    props: { smsOk: true },
  });

  return NextResponse.json({
    ok: true,
    hint: phoneHint(normalized),
    expiresInSec: 600,
    message:
      "OTP sent. Verification is by phone only — we store a one-way hash, never show your number.",
    ...(allowDevOtpInResponse() ? { devCode: code } : {}),
  });
}
