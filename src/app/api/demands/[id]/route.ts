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
  const { authorHash: _h, ...rest } = demand;
  return NextResponse.json({
    demand: { ...rest, locationLabel: locationLabel(demand) },
    supportedByMe,
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
