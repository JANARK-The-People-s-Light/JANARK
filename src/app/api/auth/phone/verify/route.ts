import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { generateAnonId } from "@/lib/identity";
import {
  hashOtp,
  hashPhone,
  normalizePhone,
  phoneHint,
  safeEqualHash,
} from "@/lib/phone";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Confirm OTP → anonymous phone session (hash + public anonId) */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "otp-verify",
    body,
    req,
    phoneRequired: false,
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
  const otp = await prisma.phoneOtp.findFirst({
    where: {
      phoneHash,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || !safeEqualHash(otp.codeHash, hashOtp(code, phoneHash))) {
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 401 },
    );
  }

  await prisma.phoneOtp.update({
    where: { id: otp.id },
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

  return NextResponse.json({
    ok: true,
    session: {
      voterKey: identity.phoneHash,
      hint: identity.phoneHint,
      anonId: identity.anonId,
      anonymous: true,
    },
    message:
      "Phone verified anonymously. Your anonymity ID is public; your number is never shown.",
  });
}
