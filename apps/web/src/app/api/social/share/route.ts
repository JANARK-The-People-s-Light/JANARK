import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  maybePostToChatChannel,
  maybePostToFeedChannel,
  maybePostToPostChannel,
} from "@/lib/social/publish";
import { guardAnonymousWrite } from "@/lib/anti-bot";
import { guardFail } from "@/lib/http";
import {
  bumpMongoStats,
  bumpTrend,
  recordActivity,
} from "@/lib/services";
import { stripPortalBase } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const PLATFORMS = new Set([
  "feed",
  "post",
  "chat",
  "stories",
  "network",
  "copy",
  "native",
]);

const PLATFORM_LABEL: Record<string, string> = {
  feed: "Feed",
  post: "Post",
  chat: "Chat",
  stories: "Stories",
  network: "Network",
  copy: "Copy link",
  native: "Device share",
};

/**
 * Track a share — requires phone OTP so bots can't inflate share counts.
 * Server-side outbound publishing is OFF by default (ALLOW_CITIZEN_SOCIAL_PUBLISH=1 to enable).
 */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const gate = await guardAnonymousWrite({
    action: "social-share",
    body,
    req,
    phoneRequired: true,
    limit: 80,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) return guardFail(gate);

  const platform = String(body.platform ?? "");
  const path = String(body.path ?? "");
  const title = body.title ? String(body.title).slice(0, 280) : undefined;

  if (!PLATFORMS.has(platform) || !path || path.length > 500) {
    return NextResponse.json(
      { error: "platform and path required" },
      { status: 400 },
    );
  }
  // Only allow relative site paths
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const event = await prisma.socialShareEvent.create({
    data: { platform, path, title },
  });

  const canonicalPath = stripPortalBase(path.split("?")[0] ?? path);
  const memeMatch = canonicalPath.match(/^\/memes\/([^/?#]+)/);
  if (memeMatch?.[1]) {
    try {
      await prisma.meme.update({
        where: { id: memeMatch[1] },
        data: { shareCount: { increment: 1 } },
      });
    } catch (err) {
      console.error("[janark] meme shareCount increment failed", err);
    }
  }

  await bumpTrend(platform, 1, "social");
  const label = PLATFORM_LABEL[platform] ?? "share";
  await recordActivity({
    kind: "share",
    summary: `Shared via ${label}${title ? `: ${title}` : ""}`,
    href: path,
  });
  await bumpMongoStats({ citizens: 1 });

  const { trackInteraction } = await import("@/lib/interactions");
  trackInteraction({
    name: "social.share",
    req,
    path,
    props: { platform, title },
  });

  const publishResults: Record<string, unknown> = {};
  if (process.env.ALLOW_CITIZEN_SOCIAL_PUBLISH === "1") {
    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";
    const url = `${site}${path}`;
    const text = title
      ? `${title} — via Janark`
      : "Shared from Janark";

    if (platform === "post") {
      publishResults.post = await maybePostToPostChannel(`${text}\n${url}`);
    }
    if (platform === "feed") {
      publishResults.feed = await maybePostToFeedChannel(url, text);
    }
    if (platform === "chat") {
      publishResults.chat = await maybePostToChatChannel(text);
    }
  }

  return NextResponse.json({ ok: true, event, publishResults });
}

export async function GET() {
  const counts = await prisma.socialShareEvent.groupBy({
    by: ["platform"],
    _count: { platform: true },
  });
  return NextResponse.json({
    counts: Object.fromEntries(
      counts.map((c) => [c.platform, c._count.platform]),
    ),
  });
}
