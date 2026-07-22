import { NextResponse } from "next/server";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail, liveJson } from "@/lib/http";
import {
  deleteEngageComment,
  listEngageComments,
  updateEngageComment,
} from "@/lib/engage";
import { parseOptionalMedia } from "@/lib/media";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH — author edits own comment */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "comment-edit",
    body,
    req,
    phoneRequired: true,
    limit: 80,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const text = String(body.body ?? "").trim();
  const hasMediaField =
    typeof body.mediaUrl === "string" || typeof body.imageUrl === "string";
  const media = hasMediaField
    ? parseOptionalMedia(body, { allow: ["gif"] })
    : null;
  if (media?.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  try {
    const comment = await updateEngageComment({
      commentId: id,
      voterKey,
      body: text,
      ...(hasMediaField
        ? { mediaUrl: media!.mediaUrl, mediaType: media!.mediaType }
        : {}),
    });
    const comments = await listEngageComments(
      comment.targetType,
      comment.targetId,
      voterKey,
    );
    return liveJson({ ok: true, comments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status =
      msg === "Not found" ? 404 : msg === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** DELETE — author deletes own comment (and its replies) */
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const gate = await guardAnonymousWrite({
    action: "comment-delete",
    body,
    req,
    phoneRequired: true,
    limit: 80,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  try {
    const meta = await deleteEngageComment({ commentId: id, voterKey });
    const comments = await listEngageComments(
      meta.targetType,
      meta.targetId,
      voterKey,
    );
    return liveJson({ ok: true, comments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status =
      msg === "Not found" ? 404 : msg === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
