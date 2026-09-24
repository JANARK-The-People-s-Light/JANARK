import { prisma } from "@/lib/db";
import { liveJson } from "@/lib/http";
import { displayAnonLabel } from "@/lib/identity";
import { resolveSessionFromRequest } from "@/lib/session";
import { popularPostsByAuthor } from "@/lib/follow-posts";
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
 * GET /api/voices?q=&page=1 — paginated popular profiles for the Rising voices directory.
 */
export async function GET(req: Request) {
  const cfg = rules.portal().followSuggestions;
  const pageSize = Math.max(1, Number(cfg.directoryPageSize));
  const pool = Math.max(pageSize, Number(cfg.directoryCandidatePool));
  const postsMax = Number(cfg.postsMax);
  const { searchParams } = new URL(req.url);
  const qRaw = (searchParams.get("q") || "").trim().toLowerCase().replace(/^#/, "");
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  const viewer = await viewerAnonId(req);
  const alreadyFollowing = viewer
    ? (
        await prisma.anonFollow.findMany({
          where: { followerId: viewer },
          select: { followingId: true },
        })
      ).map((r) => r.followingId)
    : [];
  const followingSet = new Set(alreadyFollowing);

  const popular = await prisma.anonFollow.groupBy({
    by: ["followingId"],
    _count: { followingId: true },
    orderBy: { _count: { followingId: "desc" } },
    take: pool,
  });

  const ranked: Array<{ anonId: string; followers: number }> = [];
  const seen = new Set<string>();
  for (const row of popular) {
    const id = row.followingId;
    if (!id || seen.has(id)) continue;
    if (viewer && id === viewer) continue;
    seen.add(id);
    ranked.push({ anonId: id, followers: row._count.followingId });
  }

  if (ranked.length < pool) {
    const recent = await prisma.phoneIdentity.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: pool,
      select: { anonId: true },
    });
    const fillIds = recent
      .map((r) => r.anonId)
      .filter((id) => id && !seen.has(id) && id !== viewer);
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
        if (ranked.length >= pool) break;
        ranked.push({
          anonId,
          followers: countMap.get(anonId) ?? 0,
        });
        seen.add(anonId);
      }
    }
  }

  const filtered = qRaw
    ? ranked.filter((r) => r.anonId.toLowerCase().includes(qRaw))
    : ranked;

  filtered.sort(
    (a, b) => b.followers - a.followers || a.anonId.localeCompare(b.anonId),
  );

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  const postsByAuthor = await popularPostsByAuthor(
    slice.map((r) => r.anonId),
    postsMax,
  );

  const people = slice.map((r) => ({
    anonId: r.anonId,
    label: displayAnonLabel(r.anonId),
    followers: r.followers,
    viewerFollows: followingSet.has(r.anonId),
    posts: postsByAuthor.get(r.anonId) ?? [],
  }));

  return liveJson({
    people,
    page: safePage,
    pageSize,
    total,
    pages,
    q: qRaw,
    viewerAnonId: viewer,
  });
}
