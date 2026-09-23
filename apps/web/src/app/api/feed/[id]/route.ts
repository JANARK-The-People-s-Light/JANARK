import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import {
  assertContentOwner,
  deleteEngageForTarget,
} from "@/lib/own-content";
import { resolveSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Ctx = { params: Promise<{ id: string }> };

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await connectMongo();
  const post = await FeedPost.findById(id).lean();
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await resolveSessionFromRequest(req);
  const isMine = session
    ? await assertContentOwner({
        phoneHash: session.phoneHash,
        authorHash:
          typeof post.authorHash === "string" ? post.authorHash : null,
        authorAnonId:
          typeof post.authorAnonId === "string" ? post.authorAnonId : null,
      })
    : false;

  return NextResponse.json({
    post: {
      id: String(post._id),
      publicId: post.publicId ?? null,
      type: post.type,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body ?? post.excerpt,
      href: post.href,
      author: post.author,
      authorAnonId: post.authorAnonId ?? null,
      mediaUrl: post.mediaUrl ?? null,
      mediaType: post.mediaType ?? null,
      createdAt: post.createdAt,
    },
    isMine,
  });
}

/** Author edits own feed discussion */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "feed-edit",
    body,
    req,
    phoneRequired: true,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  await connectMongo();
  const post = await FeedPost.findById(id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await assertContentOwner({
    phoneHash: voterKey,
    authorHash:
      typeof post.authorHash === "string" ? post.authorHash : null,
    authorAnonId: post.authorAnonId ?? null,
  });
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? body.excerpt ?? "").trim();
  if (!title || !text) {
    return NextResponse.json(
      { error: "title and body required" },
      { status: 400 },
    );
  }

  post.title = title;
  post.excerpt = text.slice(0, 280);
  post.body = text;
  await post.save();

  return NextResponse.json({
    post: {
      id: String(post._id),
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      authorAnonId: post.authorAnonId ?? null,
    },
    isMine: true,
  });
}

/** Author deletes own feed discussion */
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const gate = await guardAnonymousWrite({
    action: "feed-delete",
    body,
    req,
    phoneRequired: true,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  await connectMongo();
  const post = await FeedPost.findById(id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await assertContentOwner({
    phoneHash: voterKey,
    authorHash:
      typeof post.authorHash === "string" ? post.authorHash : null,
    authorAnonId: post.authorAnonId ?? null,
  });
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteEngageForTarget("feed", id);
  await FeedPost.deleteOne({ _id: id });

  return NextResponse.json({ ok: true });
}
