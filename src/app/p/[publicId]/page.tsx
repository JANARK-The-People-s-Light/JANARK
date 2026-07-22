import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthorLink } from "@/components/AuthorLink";
import { FeedEngage } from "@/components/FeedEngage";
import { FeedOwnControls } from "@/components/FeedOwnControls";
import { connectMongo } from "@/lib/mongo";
import { FeedPost } from "@/lib/mongo-models";
import { portalHref } from "@/lib/paths";
import { isPublicPostId, publicPostHref } from "@/lib/public-id";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = { params: Promise<{ publicId: string }> };

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

async function findPost(key: string) {
  await connectMongo();
  if (isPublicPostId(key)) {
    return FeedPost.findOne({ publicId: key }).lean();
  }
  if (MONGO_ID_RE.test(key)) {
    return FeedPost.findById(key).lean();
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  const post = await findPost(publicId);
  return { title: post?.title ? String(post.title) : "Post" };
}

export default async function PublicPostPage({ params }: Props) {
  const { publicId: key } = await params;
  const post = await findPost(key);
  if (!post) notFound();

  const href = String(post.href ?? "");
  const displayId =
    (typeof post.publicId === "string" && post.publicId) ||
    (isPublicPostId(key) ? key : String(post._id));

  // Canonicalize: legacy /feed links → stay on discussion view; typed posts redirect.
  if (href && !href.startsWith("/p/") && !href.startsWith("/feed")) {
    redirect(portalHref(href));
  }

  // Prefer shareable public id URL when we have one but were opened by mongo id.
  if (
    typeof post.publicId === "string" &&
    post.publicId &&
    key !== post.publicId &&
    MONGO_ID_RE.test(key)
  ) {
    redirect(portalHref(publicPostHref(post.publicId)));
  }

  const mediaUrl = post.mediaUrl ? String(post.mediaUrl) : null;
  const mediaType = post.mediaType ? String(post.mediaType) : null;
  const body =
    typeof post.body === "string" && post.body.trim()
      ? post.body
      : String(post.excerpt ?? "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs text-muted">{displayId}</p>
      <p className="mt-2 text-xs uppercase tracking-wider text-muted">
        {String(post.type)}
        {post.meta ? ` · ${String(post.meta)}` : ""}
      </p>
      <h1 className="mt-3 font-display text-3xl text-navy sm:text-4xl">
        {String(post.title)}
      </h1>
      {post.authorAnonId || post.author ? (
        <p className="mt-3 text-sm text-muted">
          <AuthorLink
            anonId={post.authorAnonId ? String(post.authorAnonId) : null}
            label={post.author ? String(post.author) : "Citizen"}
          />
        </p>
      ) : null}
      <FeedOwnControls
        id={String(post._id)}
        authorAnonId={post.authorAnonId ? String(post.authorAnonId) : null}
        title={String(post.title)}
        body={body}
      />
      <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-navy/90">
        {body}
      </p>
      {mediaUrl ? (
        <div className="mt-6 overflow-hidden">
          {mediaType === "video" ? (
            <video
              src={mediaUrl}
              controls
              playsInline
              preload="metadata"
              className="max-h-[28rem] w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt=""
              className="max-h-[28rem] w-full object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      ) : null}
      <div className="mt-8 border-t border-line pt-4">
        <FeedEngage
          post={{
            id: String(post._id),
            publicId:
              typeof post.publicId === "string" ? post.publicId : null,
            type: String(post.type),
            title: String(post.title),
            href: href.startsWith("/feed")
              ? `/p/${displayId}`
              : href || `/p/${displayId}`,
            refId: post.refId ? String(post.refId) : null,
            tags: Array.isArray(post.tags) ? post.tags.map(String) : [],
          }}
        />
      </div>
    </div>
  );
}
