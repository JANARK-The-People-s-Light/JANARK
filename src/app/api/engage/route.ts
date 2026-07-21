import { NextResponse } from "next/server";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail, liveJson } from "@/lib/http";
import {
  assertTargetExists,
  castEngageVote,
  getEngageCounts,
  isEngageTarget,
  type EngageTarget,
} from "@/lib/engage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** GET ?targetType=&targetId=&voterKey= → counts + myVote */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const targetType = url.searchParams.get("targetType") ?? "";
  const targetId = url.searchParams.get("targetId") ?? "";
  const voterKey = url.searchParams.get("voterKey");

  if (!isEngageTarget(targetType) || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId required" },
      { status: 400 },
    );
  }

  const exists = await assertTargetExists(targetType, targetId);
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const counts = await getEngageCounts(targetType, targetId, voterKey);
  return liveJson({ ok: true, ...counts, targetType, targetId });
}

/** POST { targetType, targetId, choice: upvote|downvote, voterKey } */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "engage-vote",
    body,
    req,
    phoneRequired: true,
    limit: 180,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const targetType = String(body.targetType ?? "");
  const targetId = String(body.targetId ?? "").trim();
  const choice = String(body.choice ?? "upvote");
  const voterKey = String(body.voterKey ?? "").trim();

  if (!isEngageTarget(targetType) || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId required" },
      { status: 400 },
    );
  }

  const exists = await assertTargetExists(targetType as EngageTarget, targetId);
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const value = choice === "downvote" ? (-1 as const) : (1 as const);
  const { myVote } = await castEngageVote({
    targetType: targetType as EngageTarget,
    targetId,
    voterKey,
    value,
  });

  const counts = await getEngageCounts(
    targetType as EngageTarget,
    targetId,
    voterKey,
  );

  return liveJson({
    ok: true,
    ...counts,
    myVote,
    targetType,
    targetId,
  });
}
