import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { rules } from "@/lib/config";

export type AuthorCarouselPost = {
  id: string;
  title: string;
  href: string;
  votes: number;
  type: string;
  mediaUrl: string | null;
  mediaType: string | null;
};

/**
 * Popular FeedPosts per author for Rising voices / Who to follow carousels.
 * Dedupes by publicId (Mongo dual-write can leave duplicate docs).
 */
export async function popularPostsByAuthor(
  anonIds: string[],
  postsMax: number,
): Promise<Map<string, AuthorCarouselPost[]>> {
  const out = new Map<string, AuthorCarouselPost[]>();
  if (anonIds.length === 0 || postsMax <= 0) return out;

  const multiplier = Math.max(
    1,
    Number(rules.portal().followSuggestions.postsFetchMultiplier),
  );
  const fetchLimit = postsMax * multiplier;

  try {
    await connectMongo();
    await Promise.all(
      anonIds.map(async (anonId) => {
        const docs = await FeedPost.find({ authorAnonId: anonId })
          .sort({ votes: -1, hot: -1, createdAt: -1 })
          .limit(fetchLimit)
          .select("title href votes mediaUrl mediaType type publicId")
          .lean();

        const seen = new Set<string>();
        const posts: AuthorCarouselPost[] = [];
        for (const d of docs) {
          const id = String(d.publicId || d._id);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          posts.push({
            id,
            title: String(d.title || ""),
            href: String(d.href || "/"),
            votes: Number(d.votes ?? 0),
            type: String(d.type || ""),
            mediaUrl: d.mediaUrl ? String(d.mediaUrl) : null,
            mediaType: d.mediaType ? String(d.mediaType) : null,
          });
          if (posts.length >= postsMax) break;
        }
        out.set(anonId, posts);
      }),
    );
  } catch {
    /* empty posts ok — rails still show people */
  }
  return out;
}
