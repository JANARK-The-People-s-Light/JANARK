import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import {
  bumpMongoStats,
  bumpTrend,
  mapIssue,
  recordActivity,
} from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";
import { parseOptionalMedia } from "@/lib/media";
import { publicAuthorFromVoterKey } from "@/lib/identity";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const issues = await prisma.issue.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ trendingRank: "asc" }, { voteCount: "desc" }],
  });
  return NextResponse.json({ issues: issues.map(mapIssue) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "issue-create",
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
  const category = String(body.category ?? "Education").trim();
  const summary = String(body.summary ?? "").trim();
  if (!title || !summary) {
    return NextResponse.json(
      { error: "title and summary required" },
      { status: 400 },
    );
  }

  let slug = slugify(title) || `issue-${Date.now()}`;
  const existing = await prisma.issue.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  const author = await publicAuthorFromVoterKey(String(body.voterKey ?? ""));

  const issue = await prisma.issue.create({
    data: {
      slug,
      title,
      category,
      summary,
      whyItMatters: String(body.whyItMatters ?? summary),
      currentSituation: String(body.currentSituation ?? "Citizen-raised issue."),
      pros: JSON.stringify(
        Array.isArray(body.pros) ? body.pros : ["Citizen support growing"],
      ),
      cons: JSON.stringify(
        Array.isArray(body.cons) ? body.cons : ["Needs broader debate"],
      ),
      sources: JSON.stringify(Array.isArray(body.sources) ? body.sources : []),
      relatedSlugs: JSON.stringify(
        Array.isArray(body.relatedSlugs) ? body.relatedSlugs : [],
      ),
      mediaUrl: media.mediaUrl,
      mediaType: media.mediaType,
      voteCount: 0,
      rating: 0,
    },
  });

  await connectMongo();
  await FeedPost.create({
    type: "issue",
    title,
    excerpt: summary,
    href: `/issues/${slug}`,
    meta: `${category} · new`,
    votes: 0,
    hot: true,
    tags: [category],
    refId: slug,
    author: author?.authorLabel ?? "Citizen",
    authorAnonId: author?.authorAnonId,
    body: summary,
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
  });
  await bumpTrend(category, 3);
  await recordActivity({
    kind: "issue",
    summary: `New issue raised: ${title}`,
    href: `/issues/${slug}`,
  });
  await bumpMongoStats({ citizens: 1 });

  return NextResponse.json({ issue: mapIssue(issue) }, { status: 201 });
}
