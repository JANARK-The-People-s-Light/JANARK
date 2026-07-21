import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { bumpMongoStats, recordActivity } from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";

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
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const demand = await prisma.publicDemand.findUnique({ where: { id } });
  if (!demand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { authorHash: _h, ...rest } = demand;
  return NextResponse.json({
    demand: { ...rest, locationLabel: locationLabel(demand) },
  });
}

/** Add anonymous support (phone-verified voterKey) */
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
      { error: "Verify your phone to support anonymously" },
      { status: 401 },
    );
  }

  const demand = await prisma.publicDemand.findUnique({ where: { id } });
  if (!demand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.demandSupport.create({
      data: { demandId: id, voterKey },
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
      summary: `Supported demand: ${demand.title}`,
      href: `/demands/${id}`,
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
