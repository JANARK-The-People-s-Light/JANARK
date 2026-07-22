import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import {
  isNoiseTrendTerm,
  isSystemTag,
  normalizeHashtag,
  topicTagsOnly,
} from "@/lib/hashtags";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Popular / search topic hashtags (memes catalog + feed topic tags). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const needle = q
    ? normalizeHashtag(q) || q.toLowerCase().replace(/^#/, "")
    : "";

  const [prismaTags, mongoBuckets] = await Promise.all([
    prisma.hashtag.findMany({
      where: needle ? { tag: { contains: needle } } : undefined,
      include: { _count: { select: { memes: true } } },
      orderBy: { memes: { _count: "desc" } },
      take: 40,
    }),
    (async () => {
      await connectMongo();
      const match: Record<string, unknown> = {};
      if (needle) {
        match.tags = { $regex: new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") };
      }
      return FeedPost.aggregate<{ _id: string; count: number }>([
        ...(Object.keys(match).length ? [{ $match: match }] : []),
        { $unwind: "$tags" },
        {
          $group: {
            _id: { $toLower: "$tags" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 80 },
      ]);
    })(),
  ]);

  const map = new Map<string, number>();
  for (const t of prismaTags) {
    if (isNoiseTrendTerm(t.tag) || isSystemTag(t.tag)) continue;
    if (needle && !t.tag.includes(needle)) continue;
    map.set(t.tag, (map.get(t.tag) ?? 0) + t._count.memes);
  }
  for (const b of mongoBuckets) {
    const topics = topicTagsOnly([String(b._id || "")]);
    const tag = topics[0];
    if (!tag || isNoiseTrendTerm(tag)) continue;
    if (needle && !tag.includes(needle)) continue;
    map.set(tag, (map.get(tag) ?? 0) + b.count);
  }

  const hashtags = [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 12);

  return NextResponse.json({ hashtags });
}
