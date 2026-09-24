import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { portalHref } from "@/lib/paths";
import { validatePetitionSign } from "@/lib/petition";
import { bumpMongoStats, recordActivity } from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { resolveSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function locationLabel(d: {
  village: string | null;
  town: string | null;
  city: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  country: string;
}) {
  return [d.village, d.town, d.city, d.block, d.district, d.state, d.country]
    .filter(Boolean)
    .join(", ");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const demand = await prisma.publicDemand.findUnique({ where: { id } });
  if (!demand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await resolveSessionFromRequest(req);
  let supportedByMe = false;
  if (session?.phoneHash) {
    const row = await prisma.demandSupport.findUnique({
      where: {
        demandId_voterKey: { demandId: id, voterKey: session.phoneHash },
      },
    });
    supportedByMe = Boolean(row);
  }
  const { authorHash, ...rest } = demand;
  const isMine = session
    ? await (async () => {
        const { assertContentOwner } = await import("@/lib/own-content");
        return assertContentOwner({
          phoneHash: session.phoneHash,
          authorHash,
          authorAnonId: demand.authorAnonId,
        });
      })()
    : false;
  return NextResponse.json({
    demand: { ...rest, locationLabel: locationLabel(demand) },
    supportedByMe,
    isMine,
  });
}

/**
 * Sign a petition — requires verified session + full name, ZIP/postal, phone
 * (geographic relevance). Phone is hashed; never returned to clients.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "demand-support",
    body,
    req,
    phoneRequired: true,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  if (!voterKey || voterKey.length < 32) {
    return NextResponse.json(
      { error: "Verify your phone to sign this petition" },
      { status: 401 },
    );
  }

  const validated = validatePetitionSign({
    fullName: String(body.fullName ?? ""),
    postalCode: String(body.postalCode ?? ""),
    phone: String(body.phone ?? ""),
  });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  // Petition phone must match the verified session number
  if (validated.phoneHash !== voterKey) {
    return NextResponse.json(
      {
        error:
          "Phone number must match the number you verified with OTP (proves you)",
      },
      { status: 400 },
    );
  }

  const demand = await prisma.publicDemand.findUnique({ where: { id } });
  if (!demand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.demandSupport.create({
      data: {
        demandId: id,
        voterKey,
        fullName: validated.fullName,
        postalCode: validated.postalCode,
        phoneHash: validated.phoneHash,
        phoneHint: validated.phoneHint,
      },
    });
    const updated = await prisma.publicDemand.update({
      where: { id },
      data: {
        supportCount: { increment: 1 },
        status: demand.status === "open" ? "gathering" : demand.status,
      },
    });
    await connectMongo();
    await FeedPost.updateOne({ refId: id }, { $inc: { votes: 1 } });
    await bumpMongoStats({ citizens: 1, votes: 1 });
    await recordActivity({
      kind: "vote",
      summary: `Signed petition: ${demand.title}`,
      href: portalHref(`/petitions/${id}`),
    });
    const { trackInteraction } = await import("@/lib/interactions");
    trackInteraction({
      name: "content.support",
      req,
      targetType: "demand",
      targetId: id,
      props: { kind: "petition_sign" },
    });
    const { authorHash: _h, ...rest } = updated;
    return NextResponse.json({
      ok: true,
      alreadySupported: false,
      demand: { ...rest, locationLabel: locationLabel(updated) },
    });
  } catch {
    return NextResponse.json({
      ok: true,
      alreadySupported: true,
      demand: {
        ...(({ authorHash: _a, ...r }) => r)(demand),
        locationLabel: locationLabel(demand),
      },
    });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "demand-edit",
    body,
    req,
    phoneRequired: true,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const demand = await prisma.publicDemand.findUnique({ where: { id } });
  if (!demand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { assertContentOwner, updateFeedMirrors } = await import(
    "@/lib/own-content"
  );
  const ok = await assertContentOwner({
    phoneHash: voterKey,
    authorHash: demand.authorHash,
    authorAnonId: demand.authorAnonId,
  });
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  const ask = String(body.ask ?? demand.ask).trim();
  if (!title || !text || !ask) {
    return NextResponse.json(
      { error: "title, ask, and body required" },
      { status: 400 },
    );
  }

  const updated = await prisma.publicDemand.update({
    where: { id },
    data: { title, body: text, ask },
  });

  await updateFeedMirrors(
    { refId: id },
    {
      title,
      excerpt: text.slice(0, 220),
      body: text,
    },
  );

  const { authorHash: _h, ...rest } = updated;
  return NextResponse.json({
    demand: { ...rest, locationLabel: locationLabel(updated) },
    isMine: true,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const gate = await guardAnonymousWrite({
    action: "demand-delete",
    body,
    req,
    phoneRequired: true,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const voterKey = String(body.voterKey ?? "").trim();
  const demand = await prisma.publicDemand.findUnique({ where: { id } });
  if (!demand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const {
    assertContentOwner,
    deleteEngageForTarget,
    deleteFeedMirrors,
  } = await import("@/lib/own-content");
  const ok = await assertContentOwner({
    phoneHash: voterKey,
    authorHash: demand.authorHash,
    authorAnonId: demand.authorAnonId,
  });
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteEngageForTarget("demand", id);
  await deleteFeedMirrors({ refId: id });
  await prisma.publicDemand.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
