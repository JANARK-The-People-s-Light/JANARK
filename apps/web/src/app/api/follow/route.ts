import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail, liveJson } from "@/lib/http";
import {
  displayAnonLabel,
  identityByAnonId,
  isValidAnonId,
} from "@/lib/identity";
import { resolveSessionFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function followerAnonFromRequest(req: Request): Promise<string | null> {
  const session = await resolveSessionFromRequest(req);
  if (!session?.phoneHash) return null;
  const identity = await prisma.phoneIdentity.findUnique({
    where: { phoneHash: session.phoneHash },
    select: { anonId: true },
  });
  return identity?.anonId ?? null;
}

async function followCounts(anonId: string) {
  const [followers, following] = await Promise.all([
    prisma.anonFollow.count({ where: { followingId: anonId } }),
    prisma.anonFollow.count({ where: { followerId: anonId } }),
  ]);
  return { followers, following };
}

/** GET ?anonId=jn-… → counts + whether the viewer follows them */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const anonId = (url.searchParams.get("anonId") ?? "").toLowerCase();
  const list = url.searchParams.get("list"); // followers | following

  if (!isValidAnonId(anonId)) {
    return NextResponse.json({ error: "Invalid anonymity ID" }, { status: 400 });
  }

  const identity = await identityByAnonId(anonId);
  if (!identity) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const viewerAnonId = await followerAnonFromRequest(req);
  const counts = await followCounts(anonId);
  const viewerFollows = viewerAnonId
    ? Boolean(
        await prisma.anonFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerAnonId,
              followingId: anonId,
            },
          },
        }),
      )
    : false;

  let people: Array<{ anonId: string; label: string }> | undefined;
  if (list === "followers" || list === "following") {
    if (list === "followers") {
      const rows = await prisma.anonFollow.findMany({
        where: { followingId: anonId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { followerId: true },
      });
      people = rows.map((r) => ({
        anonId: r.followerId,
        label: displayAnonLabel(r.followerId),
      }));
    } else {
      const rows = await prisma.anonFollow.findMany({
        where: { followerId: anonId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { followingId: true },
      });
      people = rows.map((r) => ({
        anonId: r.followingId,
        label: displayAnonLabel(r.followingId),
      }));
    }
  }

  return liveJson({
    anonId,
    followers: counts.followers,
    followingCount: counts.following,
    viewerFollows,
    isSelf: Boolean(viewerAnonId && viewerAnonId === anonId),
    viewerAnonId: viewerAnonId ?? null,
    ...(people ? { people, list } : {}),
  });
}

/**
 * POST { anonId } — toggle follow.
 * Optional action: "follow" | "unfollow" to force a state.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "anon-follow",
    body,
    req,
    phoneRequired: true,
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const targetId = String(body.anonId ?? "")
    .trim()
    .toLowerCase();
  if (!isValidAnonId(targetId)) {
    return NextResponse.json({ error: "Invalid anonymity ID" }, { status: 400 });
  }

  const target = await identityByAnonId(targetId);
  if (!target) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const followerId = await followerAnonFromRequest(req);
  if (!followerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (followerId === targetId) {
    return NextResponse.json(
      { error: "You cannot follow yourself" },
      { status: 400 },
    );
  }

  const actionRaw = String(body.action ?? "toggle").toLowerCase();
  const existing = await prisma.anonFollow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId: targetId },
    },
  });

  let following = Boolean(existing);
  if (actionRaw === "follow") {
    if (!existing) {
      await prisma.anonFollow.create({
        data: { followerId, followingId: targetId },
      });
    }
    following = true;
  } else if (actionRaw === "unfollow") {
    if (existing) {
      await prisma.anonFollow.delete({
        where: { id: existing.id },
      });
    }
    following = false;
  } else {
    // toggle
    if (existing) {
      await prisma.anonFollow.delete({ where: { id: existing.id } });
      following = false;
    } else {
      await prisma.anonFollow.create({
        data: { followerId, followingId: targetId },
      });
      following = true;
    }
  }

  const counts = await followCounts(targetId);
  return liveJson({
    ok: true,
    anonId: targetId,
    viewerFollows: following,
    followers: counts.followers,
    followingCount: counts.following,
  });
}
