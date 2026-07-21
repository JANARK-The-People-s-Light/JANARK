import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail, liveJson } from "@/lib/http";
import { isEngageTarget } from "@/lib/engage";
import { recordActivity } from "@/lib/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const REASONS = new Set([
  "spam",
  "harassment",
  "misinformation",
  "doxxing",
  "illegal",
  "other",
]);

/** POST — anonymously flag a post, comment, or reply */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "content-flag",
    body,
    req,
    phoneRequired: true,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const targetType = String(body.targetType ?? "").trim();
  const targetId = String(body.targetId ?? "").trim();
  const reason = String(body.reason ?? "").trim();
  const detail =
    typeof body.detail === "string" ? body.detail.trim().slice(0, 500) : null;
  const reporterKey = String(body.voterKey ?? "").trim();

  if (!isEngageTarget(targetType) || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId required" },
      { status: 400 },
    );
  }
  if (!REASONS.has(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const existing = await prisma.contentFlag.findUnique({
    where: {
      targetType_targetId_reporterKey: {
        targetType,
        targetId,
        reporterKey,
      },
    },
  });
  if (existing) {
    return liveJson({
      ok: true,
      alreadyReported: true,
      message: "You already reported this",
    });
  }

  await prisma.contentFlag.create({
    data: {
      targetType,
      targetId,
      reason,
      detail: detail || null,
      reporterKey,
    },
  });

  await recordActivity({
    kind: "discussion",
    summary: `Content flagged (${reason})`,
    href: "/",
    meta: { targetType, targetId, reason },
  });

  return liveJson({ ok: true, alreadyReported: false }, { status: 201 });
}
