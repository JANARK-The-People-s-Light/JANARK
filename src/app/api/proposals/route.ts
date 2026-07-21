import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import {
  bumpMongoStats,
  bumpTrend,
  mapProposal,
  recordActivity,
} from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";
import { parseOptionalMedia } from "@/lib/media";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { allocatePublicPostId } from "@/lib/public-id";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { totalVotes: "desc" },
  });
  return NextResponse.json({ proposals: proposals.map(mapProposal) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "proposal-create",
    body,
    req,
    phoneRequired: true,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);
  const terms = requireCivicPostTerms(body);
  if (!terms.ok) {
    return NextResponse.json({ error: terms.error }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title || !description) {
    return NextResponse.json(
      { error: "title and description required" },
      { status: 400 },
    );
  }

  let id = slugify(title) || `proposal-${Date.now()}`;
  if (await prisma.proposal.findUnique({ where: { id } })) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const voteTypeRaw = String(body.voteType ?? "");
  const voteType = (["likert", "checklist", "preference"] as const).includes(
    voteTypeRaw as "likert" | "checklist" | "preference",
  )
    ? (voteTypeRaw as "likert" | "checklist" | "preference")
    : "likert";

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  const author = await publicAuthorFromVoterKey(String(body.voterKey ?? ""));
  const publicId = await allocatePublicPostId();

  const proposal = await prisma.proposal.create({
    data: {
      id,
      publicId,
      title,
      description,
      benefits: JSON.stringify(
        Array.isArray(body.benefits) ? body.benefits : ["Public mandate"],
      ),
      argumentsFor: JSON.stringify(
        Array.isArray(body.argumentsFor)
          ? body.argumentsFor
          : ["Citizen-led reform"],
      ),
      argumentsAgainst: JSON.stringify(
        Array.isArray(body.argumentsAgainst)
          ? body.argumentsAgainst
          : ["Needs careful design"],
      ),
      voteType,
      options: body.options ? JSON.stringify(body.options) : null,
      results: null,
      totalVotes: 0,
      issueSlug:
        typeof body.issueSlug === "string" && body.issueSlug.trim()
          ? body.issueSlug.trim()
          : null,
      locationLevel: body.locationLevel
        ? String(body.locationLevel)
        : "national",
      town: body.town ? String(body.town).trim() : null,
      city: body.city ? String(body.city).trim() : null,
      district: body.district ? String(body.district).trim() : null,
      state: body.state ? String(body.state).trim() : null,
      country: String(body.country ?? "India").trim() || "India",
      mediaUrl: media.mediaUrl,
      mediaType: media.mediaType,
    },
  });

  await connectMongo();
  await FeedPost.create({
    type: "proposal",
    title,
    excerpt: description.slice(0, 200),
    publicId,
    href: `/vote/${id}`,
    meta: "Open vote · new",
    votes: 0,
    hot: true,
    tags: ["vote"],
    refId: id,
    author: author?.authorLabel ?? "Citizen",
    authorAnonId: author?.authorAnonId,
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
  });
  await bumpTrend("Open vote", 2);
  await recordActivity({
    kind: "proposal",
    summary: `New proposal: ${title}`,
    href: `/vote/${id}`,
  });
  await bumpMongoStats({ activeProposals: 1, citizens: 1 });

  return NextResponse.json({ proposal: mapProposal(proposal) }, { status: 201 });
}
