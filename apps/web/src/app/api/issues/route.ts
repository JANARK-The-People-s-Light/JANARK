import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import {
  bumpMongoStats,
  bumpTopicTrends,
  mapIssue,
  recordActivity,
  mirrorFeedCard,
} from "@/lib/services";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";
import { parseOptionalMedia } from "@/lib/media";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { allocatePublicPostId } from "@/lib/public-id";
import {
  buildFeedTags,
  collectTopicHashtags,
} from "@/lib/hashtags";
import { ensureHashtagCatalog } from "@/lib/ensure-hashtags";

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
  const category = String(body.category ?? "Infrastructure").trim();
  const summary =
    String(body.summary ?? "").trim() || title;
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  let slug = slugify(title) || `issue-${Date.now()}`;
  const existing = await prisma.issue.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const media = parseOptionalMedia(body);
  if (media.error) {
    return NextResponse.json({ error: media.error }, { status: 400 });
  }

  const author = await publicAuthorFromVoterKey(String(body.voterKey ?? ""));
  const publicId = await allocatePublicPostId();

  const issue = await prisma.issue.create({
    data: {
      publicId,
      slug,
      title,
      category,
      summary,
      whyItMatters: String(body.whyItMatters ?? summary),
      currentSituation: String(body.currentSituation ?? "Citizen-raised issue."),
      pros: JSON.stringify(Array.isArray(body.pros) ? body.pros : []),
      cons: JSON.stringify(Array.isArray(body.cons) ? body.cons : []),
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

  const topics = collectTopicHashtags({
    hashtags: body.hashtags ?? body.tags,
    texts: [title, summary],
  });
  await ensureHashtagCatalog(topics);
  await connectMongo();
  await mirrorFeedCard({
    type: "issue",
    title,
    excerpt: summary,
    publicId,
    href: `/issues/${slug}`,
    meta: `${category} · new`,
    votes: 0,
    hot: true,
    tags: buildFeedTags([category], topics),
    refId: slug,
    author: author?.authorLabel ?? "Citizen",
    authorAnonId: author?.authorAnonId,
    body: summary,
    mediaUrl: media.mediaUrl ?? undefined,
    mediaType: media.mediaType ?? undefined,
  });
  await bumpTopicTrends(topics, 2, "issue");
  await recordActivity({
    kind: "issue",
    summary: `New issue raised: ${title}`,
    href: `/issues/${slug}`,
  });
  await bumpMongoStats({ citizens: 1 });

  return NextResponse.json({ issue: mapIssue(issue) }, { status: 201 });
}
