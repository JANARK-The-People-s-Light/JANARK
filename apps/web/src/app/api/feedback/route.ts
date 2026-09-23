import { NextResponse } from "next/server";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { fill, rules, templates } from "@/lib/config";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  if (!rules.features().landingFeedback) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const modal = templates.landing().contribute.feedbackModal;
  const brand = templates.brand();
  const applyRules = rules.landingFeedback();

  const guard = await guardAnonymousWrite({
    action: "landing-feedback",
    body,
    req,
    phoneRequired: false,
    requireTurnstile: false,
    limit: applyRules.rateLimit,
    windowMs: applyRules.windowMs,
  });
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const message = asString(body.message);
  const emailRaw = asString(body.email).toLowerCase();
  const maxLen = Math.min(
    applyRules.messageMaxLength,
    modal.messageMaxLength,
  );

  const errors: Record<string, string> = {};
  if (!message) errors.message = "Required";
  else if (message.length > maxLen) {
    errors.message = `Max ${maxLen} characters`;
  }
  if (emailRaw && !isValidEmail(emailRaw)) errors.email = "Invalid email";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", errors },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.landingFeedback.create({
      data: {
        message,
        email: emailRaw || null,
      },
    });
    return NextResponse.json({
      ok: true,
      id: row.id,
      successBody: fill(modal.successBody, { name: brand.name }),
    });
  } catch (e) {
    console.error("landing feedback failed", e);
    return NextResponse.json({ error: modal.errorGeneric }, { status: 500 });
  }
}
