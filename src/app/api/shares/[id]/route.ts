import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import {
  assertContentOwner,
  deleteEngageForTarget,
  deleteFeedMirrors,
  updateFeedMirrors,
} from "@/lib/own-content";
import { resolveSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Ctx = { params: Promise<{ id: string }> };

function titleFromCaption(caption: string) {
  const line = caption.split(/\n/)[0]?.trim() || caption.trim();
  return line.slice(0, 120) || "Community share";
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const share = await prisma.communityShare.findUnique({ where: { id } });
  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { authorHash, ...rest } = share;

  let feedPostId: string | null = null;
  try {
    await connectMongo();
    const feed = await FeedPost.findOne({ type: "share", refId: id })
      .select("_id")
      .lean();
    if (feed && typeof feed === "object" && "_id" in feed) {
      feedPostId = String(feed._id);
    }
  } catch {
    /* optional */
  }

  const session = await resolveSessionFromRequest(req);
  const isMine = session
    ? await assertContentOwner({
        phoneHash: session.phoneHash,
        authorHash,
        authorAnonId: share.authorAnonId,
      })
    : false;

  return NextResponse.json({ share: rest, feedPostId, isMine });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "share-edit",
    body,
    req,
    phoneRequired: true,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const share = await prisma.communityShare.findUnique({ where: { id } });
  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ok = await assertContentOwner({
    phoneHash: voterKey,
    authorHash: share.authorHash,
    authorAnonId: share.authorAnonId,
  });
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const caption = String(body.caption ?? "").trim();
  if (!caption) {
    return NextResponse.json({ error: "caption required" }, { status: 400 });
  }

  const locationLabel =
    typeof body.locationLabel === "string"
      ? body.locationLabel.trim() || null
      : share.locationLabel;

  const updated = await prisma.communityShare.update({
    where: { id },
    data: {
      caption,
      locationLabel,
    },
  });

  const title = titleFromCaption(caption);
  await updateFeedMirrors(
    { refId: id, type: "share" },
    {
      title,
      excerpt: caption.slice(0, 220),
      body: caption,
    },
  );

  const { authorHash: _h, ...rest } = updated;
  return NextResponse.json({ share: rest, isMine: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const gate = await guardAnonymousWrite({
    action: "share-delete",
    body,
    req,
    phoneRequired: true,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const share = await prisma.communityShare.findUnique({ where: { id } });
  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ok = await assertContentOwner({
    phoneHash: voterKey,
    authorHash: share.authorHash,
    authorAnonId: share.authorAnonId,
  });
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let feedPostId: string | null = null;
  try {
    await connectMongo();
    const feed = await FeedPost.findOne({ type: "share", refId: id })
      .select("_id")
      .lean();
    if (feed && typeof feed === "object" && "_id" in feed) {
      feedPostId = String(feed._id);
    }
  } catch {
    /* ignore */
  }

  if (feedPostId) {
    await deleteEngageForTarget("feed", feedPostId);
  }
  await deleteFeedMirrors({ refId: id, type: "share", feedPostId: feedPostId ?? undefined });
  await prisma.communityShare.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
