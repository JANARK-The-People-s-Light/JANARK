import { NextResponse } from "next/server";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { getMaintainersForm, rules } from "@/lib/config";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  if (!rules.features().maintainerApplications) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const form = getMaintainersForm();
  const applyRules = rules.maintainerApply();

  const guard = await guardAnonymousWrite({
    action: "maintainer-apply",
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

  const errors: Record<string, string> = {};
  const fullName = asString(body.fullName);
  const email = asString(body.email).toLowerCase();
  const githubUrl = asString(body.githubUrl);
  const whyJanark = asString(body.whyJanark);
  const maxWhy = form.motivationMaxLength;

  if (!fullName) errors.fullName = "Required";
  if (!email) errors.email = "Required";
  else if (!isValidEmail(email)) errors.email = "Invalid email";
  if (!githubUrl) errors.githubUrl = "Required";
  else if (!isValidUrl(githubUrl)) errors.githubUrl = "Invalid URL";
  if (!whyJanark) errors.whyJanark = "Required";
  else if (whyJanark.length > maxWhy) {
    errors.whyJanark = `Max ${maxWhy} characters`;
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", errors },
      { status: 400 },
    );
  }

  let detailsJson: string | null = null;
  if (body.details && typeof body.details === "object") {
    try {
      detailsJson = JSON.stringify(body.details);
    } catch {
      detailsJson = null;
    }
  }

  try {
    const row = await prisma.maintainerApplication.create({
      data: {
        fullName,
        email,
        githubUrl,
        whyJanark,
        detailsJson,
      },
    });
    const { trackInteraction } = await import("@/lib/interactions");
    trackInteraction({
      name: "maintainer.apply",
      req,
      props: { id: row.id },
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("maintainer apply failed", e);
    return NextResponse.json({ error: form.errorGeneric }, { status: 500 });
  }
}
