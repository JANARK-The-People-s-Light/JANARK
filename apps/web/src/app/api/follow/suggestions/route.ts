import { prisma } from "@/lib/db";
import { liveJson } from "@/lib/http";
import { displayAnonLabel } from "@/lib/identity";
import { resolveSessionFromRequest } from "@/lib/session";
import { rules } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function viewerAnonId(req: Request): Promise<string | null> {
  const session = await resolveSessionFromRequest(req);
  if (!session?.phoneHash) return null;
  const identity = await prisma.phoneIdentity.findUnique({
    where: { phoneHash: session.phoneHash },
    select: { anonId: true },
  });
  return identity?.anonId ?? null;
}

/**
 * GET — recommended people to follow for the left-rail section.
 * Ranks by follower count, then fills with recently active identities.
 * Excludes the viewer and accounts they already follow.
 */
export async function GET(req: Request) {
  const cfg = rules.portal().followSuggestions;
  const maxPeople = Number(cfg.maxPeople);
  const pool = Number(cfg.candidatePool);
  const viewer = await viewerAnonId(req);

  const alreadyFollowing = viewer
    ? (
        await prisma.anonFollow.findMany({
          where: { followerId: viewer },
          select: { followingId: true },
        })
      ).map((r) => r.followingId)
    : [];
  const exclude = new Set<string>([
    ...(viewer ? [viewer] : []),
    ...alreadyFollowing,
  ]);

  const popular = await prisma.anonFollow.groupBy({
    by: ["followingId"],
    _count: { followingId: true },
    orderBy: { _count: { followingId: "desc" } },
    take: pool,
  });

  const ranked: Array<{ anonId: string; followers: number }> = [];
  for (const row of popular) {
    if (exclude.has(row.followingId)) continue;
    ranked.push({
      anonId: row.followingId,
      followers: row._count.followingId,
    });
    if (ranked.length >= maxPeople) break;
  }

  if (ranked.length < maxPeople) {
    const have = new Set(ranked.map((r) => r.anonId));
    const recent = await prisma.phoneIdentity.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: pool,
      select: { anonId: true },
    });
    const fillIds = recent
      .map((id) => id.anonId)
      .filter((id) => id && !exclude.has(id) && !have.has(id))
      .slice(0, maxPeople - ranked.length);

    if (fillIds.length > 0) {
      const counts = await prisma.anonFollow.groupBy({
        by: ["followingId"],
        where: { followingId: { in: fillIds } },
        _count: { followingId: true },
      });
      const countMap = new Map(
        counts.map((c) => [c.followingId, c._count.followingId]),
      );
      for (const anonId of fillIds) {
        ranked.push({
          anonId,
          followers: countMap.get(anonId) ?? 0,
        });
      }
    }
  }

  const people = ranked.map((r) => ({
    anonId: r.anonId,
    label: displayAnonLabel(r.anonId),
    followers: r.followers,
    viewerFollows: false,
  }));

  return liveJson({
    people,
    viewerAnonId: viewer,
  });
}
