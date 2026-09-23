import { prisma } from "@/lib/db";
import { topicTagsOnly } from "@/lib/hashtags";

/** Ensure topic tags exist in the shared Hashtag catalog (for autocomplete). */
export async function ensureHashtagCatalog(tags: string[]): Promise<void> {
  const topics = topicTagsOnly(tags);
  if (topics.length === 0) return;
  await Promise.all(
    topics.map((tag) =>
      prisma.hashtag.upsert({
        where: { tag },
        create: { tag },
        update: {},
      }),
    ),
  );
}
