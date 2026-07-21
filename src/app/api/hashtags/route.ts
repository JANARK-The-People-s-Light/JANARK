import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeHashtag } from "@/lib/memes";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Popular / search hashtags used on memes */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const needle = q ? normalizeHashtag(q) || q.toLowerCase().replace(/^#/, "") : "";

  const tags = await prisma.hashtag.findMany({
    where: needle
      ? { tag: { contains: needle } }
      : undefined,
    include: { _count: { select: { memes: true } } },
    orderBy: { memes: { _count: "desc" } },
    take: 12,
  });

  return NextResponse.json({
    hashtags: tags.map((t) => ({
      tag: t.tag,
      count: t._count.memes,
    })),
  });
}
