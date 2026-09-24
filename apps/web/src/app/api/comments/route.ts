import { NextResponse } from "next/server";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail, liveJson } from "@/lib/http";
import {
  assertTargetExists,
  createEngageComment,
  isEngageTarget,
  listEngageComments,
  type EngageTarget,
} from "@/lib/engage";
import { parseOptionalMedia } from "@/lib/media";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";
import { resolveSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** GET ?targetType=&targetId= → threaded comments (my votes via session cookie) */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const targetType = url.searchParams.get("targetType") ?? "";
  const targetId = url.searchParams.get("targetId") ?? "";
  const session = await resolveSessionFromRequest(req);
  const voterKey = session?.phoneHash ?? null;

  if (!isEngageTarget(targetType) || targetType === "comment" || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId required" },
      { status: 400 },
    );
  }

  const comments = await listEngageComments(targetType, targetId, voterKey);
  return liveJson({ ok: true, comments });
}

/** POST create comment or reply */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "engage-comment",
    body,
    req,
    phoneRequired: true,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);
  const terms = requireCivicPostTerms(body);
  if (!terms.ok) {
    return NextResponse.json({ error: terms.error }, { status: 400 });
  }

  const targetType = String(body.targetType ?? "");
  const targetId = String(body.targetId ?? "").trim();
  const text = String(body.body ?? "").trim();
  const parentId =
    typeof body.parentId === "string" && body.parentId.trim()
      ? body.parentId.trim()
      : null;
  const voterKey = String(body.voterKey ?? "").trim();

  if (!isEngageTarget(targetType) || targetType === "comment" || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId required" },
      { status: 400 },
    );
  }

  const media = parseOptionalMedia(body, { allow: ["gif"] });
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  if (!media.mediaUrl && (text.length < 2 || text.length > 4000)) {
    return NextResponse.json(
      { error: "Comment must be 2–4000 characters (or attach a GIF)" },
      { status: 400 },
    );
  }
  if (text.length > 4000) {
    return NextResponse.json(
      { error: "Comment must be at most 4000 characters" },
      { status: 400 },
    );
  }

  const exists = await assertTargetExists(targetType as EngageTarget, targetId);
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const comment = await createEngageComment({
      targetType: targetType as Exclude<EngageTarget, "comment">,
      targetId,
      voterKey,
      body: text,
      parentId,
      mediaUrl: media.mediaUrl,
      mediaType: media.mediaType,
    });
    const comments = await listEngageComments(targetType, targetId, voterKey);
    const { trackInteraction } = await import("@/lib/interactions");
    trackInteraction({
      name: "engage.comment",
      req,
      targetType,
      targetId,
      props: {
        commentId: comment.id,
        hasParent: Boolean(parentId),
        hasMedia: Boolean(comment.mediaUrl),
      },
    });
    return liveJson({
      ok: true,
      comment: {
        id: comment.id,
        body: comment.body,
        authorLabel: comment.authorLabel,
        authorAnonId: comment.authorAnonId,
        mediaUrl: comment.mediaUrl,
        mediaType: comment.mediaType,
        createdAt: comment.createdAt.toISOString(),
        parentId: comment.parentId,
      },
      comments,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
