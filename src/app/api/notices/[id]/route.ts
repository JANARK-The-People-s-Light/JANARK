import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { bumpMongoStats, recordActivity } from "@/lib/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ notice });
}

/** Sign a notice — requires phone OTP verification */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  // Accept voterKey (preferred) or legacy signerKey
  if (!body.voterKey && body.signerKey) {
    body.voterKey = body.signerKey;
  }

  const gate = await guardAnonymousWrite({
    action: "notice-sign",
    body,
    req,
    phoneRequired: true,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();

  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.signature.create({
      data: { noticeId: id, signerKey: voterKey },
    });
    const updated = await prisma.notice.update({
      where: { id },
      data: { signatures: { increment: 1 } },
    });
    await connectMongo();
    await FeedPost.updateOne({ refId: id }, { $inc: { votes: 1 } });
    await bumpMongoStats({ citizens: 1 });
    await recordActivity({
      kind: "notice",
      summary: `Signature added: ${notice.title}`,
      href: `/notice/${id}`,
    });
    return NextResponse.json({
      ok: true,
      notice: updated,
      alreadySigned: false,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      notice,
      alreadySigned: true,
    });
  }
}
