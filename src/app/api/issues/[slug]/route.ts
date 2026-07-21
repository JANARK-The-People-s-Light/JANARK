import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { Discussion } from "@/lib/mongo-models";
import { mapIssue, mapProposal } from "@/lib/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const issue = await prisma.issue.findUnique({ where: { slug } });
  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [sqliteComments, proposals, related, mongoDiscussions] =
    await Promise.all([
      prisma.comment.findMany({
        where: { issueSlug: slug },
        orderBy: { upvotes: "desc" },
      }),
      prisma.proposal.findMany({ where: { issueSlug: slug } }),
      prisma.issue.findMany({
        where: {
          slug: { in: JSON.parse(issue.relatedSlugs) as string[] },
        },
      }),
      connectMongo().then(() =>
        Discussion.find({ issueSlug: slug }).sort({ upvotes: -1 }).lean(),
      ),
    ]);

  const discussionMap = new Map<string, {
    id: string;
    author: string;
    body: string;
    upvotes: number;
    kind: string;
    createdAt: string;
    source: "sqlite" | "mongo";
  }>();

  for (const c of sqliteComments) {
    discussionMap.set(c.id, {
      id: c.id,
      author: c.author,
      body: c.body,
      upvotes: c.upvotes,
      kind: c.kind,
      createdAt: c.createdAt.toISOString().slice(0, 10),
      source: "sqlite",
    });
  }
  for (const c of mongoDiscussions) {
    discussionMap.set(String(c._id), {
      id: String(c._id),
      author: c.author,
      body: c.body,
      upvotes: c.upvotes ?? 0,
      kind: c.kind ?? "opinion",
      createdAt: c.createdAt
        ? new Date(c.createdAt).toISOString().slice(0, 10)
        : "",
      source: "mongo",
    });
  }

  return NextResponse.json({
    issue: mapIssue(issue),
    discussions: [...discussionMap.values()].sort(
      (a, b) => b.upvotes - a.upvotes,
    ),
    proposals: proposals.map(mapProposal),
    related: related.map(mapIssue),
  });
}
