import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import {
  bumpMongoStats,
  bumpTrend,
  recordActivity,
} from "@/lib/services";
import {
  isValidMediaUrl,
  parseHashtags,
  publicMeme,
  score,
} from "@/lib/memes";
import { detectMediaType } from "@/lib/media";
import { publicAuthorFromVoterKey } from "@/lib/identity";
import { requireCivicPostTerms } from "@/lib/civic-post-terms";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function serializeMeme(
  meme: {
    id: string;
    title: string;
    caption: string | null;
    imageUrl: string;
    sourceUrl: string | null;
    authorLabel: string;
    authorAnonId?: string | null;
    authorHash?: string | null;
    upvotes: number;
    downvotes: number;
    shareCount: number;
    createdAt: Date;
    updatedAt: Date;
    tags?: { hashtag: { tag: string } }[];
  },
  myVote?: number | null,
) {
  const tags = (meme.tags ?? []).map((t) => t.hashtag.tag);
  return {
    ...publicMeme(meme),
    tags,
    score: score(meme.upvotes, meme.downvotes),
    myVote: myVote ?? null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag")?.replace(/^#/, "").toLowerCase().trim();
  const q = searchParams.get("q")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "hot";
  const voterKey = searchParams.get("voterKey");

  const memes = await prisma.meme.findMany({
    where: {
      ...(tag ? { tags: { some: { hashtag: { tag } } } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { caption: { contains: q } },
              {
                tags: {
                  some: {
                    hashtag: { tag: { contains: q.toLowerCase() } },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      tags: { include: { hashtag: true } },
      votes: voterKey ? { where: { voterKey }, take: 1 } : false,
    },
    orderBy:
      sort === "new"
        ? { createdAt: "desc" }
        : [{ upvotes: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  return NextResponse.json({
    memes: memes.map((m) => {
      const myVote =
        Array.isArray(m.votes) && m.votes[0] ? m.votes[0].value : null;
      const { votes: _v, ...rest } = m;
      return serializeMeme(rest, myVote);
    }),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "meme-create",
    body,
    req,
    phoneRequired: true,
    limit: 15,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);
  const terms = requireCivicPostTerms(body);
  if (!terms.ok) {
    return NextResponse.json({ error: terms.error }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const caption = body.caption ? String(body.caption).trim() : null;
  const imageUrl = String(body.imageUrl ?? "").trim();
  const sourceUrl = body.sourceUrl ? String(body.sourceUrl).trim() : null;
  const tags = parseHashtags(body.hashtags ?? body.tags);
  const voterKey = String(body.voterKey ?? "");
  const publicAuthor = await publicAuthorFromVoterKey(voterKey);
  if (!publicAuthor) {
    return NextResponse.json(
      { error: "Verify your phone to post" },
      { status: 401 },
    );
  }

  if (!title || !imageUrl) {
    return NextResponse.json(
      { error: "title and media link required" },
      { status: 400 },
    );
  }
  if (!isValidMediaUrl(imageUrl)) {
    return NextResponse.json(
      { error: "Media must be a valid http(s) link (image, GIF, or video)" },
      { status: 400 },
    );
  }
  if (sourceUrl && !isValidMediaUrl(sourceUrl)) {
    return NextResponse.json(
      { error: "sourceUrl must be a valid http(s) link" },
      { status: 400 },
    );
  }
  if (tags.length === 0) {
    return NextResponse.json(
      { error: "Add at least one hashtag (e.g. #janark)" },
      { status: 400 },
    );
  }

  const mediaType = detectMediaType(imageUrl);

  const meme = await prisma.$transaction(async (tx) => {
    const created = await tx.meme.create({
      data: {
        title,
        caption,
        imageUrl,
        mediaType,
        sourceUrl,
        authorLabel: publicAuthor.authorLabel,
        authorAnonId: publicAuthor.authorAnonId,
        authorHash: voterKey,
      },
    });

    for (const tag of tags) {
      const hashtag = await tx.hashtag.upsert({
        where: { tag },
        create: { tag },
        update: {},
      });
      await tx.memeTag.create({
        data: { memeId: created.id, hashtagId: hashtag.id },
      });
    }

    return tx.meme.findUniqueOrThrow({
      where: { id: created.id },
      include: { tags: { include: { hashtag: true } } },
    });
  });

  const tagList = meme.tags.map((t) => t.hashtag.tag);

  await connectMongo();
  await FeedPost.create({
    type: "meme",
    title,
    excerpt: caption?.slice(0, 220) || `#${tagList.slice(0, 3).join(" #")}`,
    body: caption ?? undefined,
    href: `/memes/${meme.id}`,
    meta: tagList.map((t) => `#${t}`).join(" "),
    votes: 0,
    hot: true,
    tags: ["meme", ...tagList],
    refId: meme.id,
    author: meme.authorLabel,
    authorAnonId: publicAuthor.authorAnonId,
    mediaUrl: imageUrl,
    mediaType,
  });
  for (const t of tagList.slice(0, 5)) {
    await bumpTrend(`#${t}`, 2, "meme");
  }
  await bumpMongoStats({ citizens: 1 });
  await recordActivity({
    kind: "meme",
    summary: `Meme posted: ${title}`,
    href: `/memes/${meme.id}`,
  });

  return NextResponse.json({ meme: serializeMeme(meme) }, { status: 201 });
}
