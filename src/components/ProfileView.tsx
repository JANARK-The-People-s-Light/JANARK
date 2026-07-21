"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthorLink } from "@/components/AuthorLink";

type ProfilePayload = {
  profile: { anonId: string; label: string; memberSince: string };
  counts: { posts: number; reactions: number; memberSince: string };
  posts: {
    memes: Array<{
      id: string;
      title: string;
      caption?: string | null;
      imageUrl: string;
      href: string;
      tags: string[];
      upvotes: number;
      downvotes: number;
      createdAt: string;
    }>;
    reports: Array<{
      id: string;
      type: string;
      title: string;
      href: string;
      upvotes: number;
      createdAt: string;
    }>;
    demands: Array<{
      id: string;
      title: string;
      ask: string;
      href: string;
      supportCount: number;
      createdAt: string;
    }>;
    notices: Array<{
      id: string;
      title: string;
      target: string;
      href: string;
      signatures: number;
      createdAt: string;
    }>;
    discussions: Array<{
      id: string;
      body: string;
      kind: string;
      href: string;
      createdAt: string;
    }>;
  };
  reactions: {
    memeVotes: Array<{
      id: string;
      choice: string;
      title: string;
      href: string;
      createdAt: string;
    }>;
    reportReactions: Array<{
      id: string;
      reaction: string;
      title: string;
      href: string;
      createdAt: string;
    }>;
    reportVotes: Array<{
      id: string;
      choice: string;
      title: string;
      href: string;
      createdAt: string;
    }>;
    demandSupports: Array<{
      id: string;
      title: string;
      href: string;
      createdAt: string;
    }>;
    proposalVotes: Array<{
      id: string;
      choice: string;
      title: string;
      href: string;
      createdAt: string;
    }>;
    noticeSignatures: Array<{
      id: string;
      title: string;
      href: string;
      createdAt: string;
    }>;
  };
};

type Tab = "posts" | "reactions";

function fmt(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d.slice(0, 10);
  }
}

export function ProfileView({ anonId }: { anonId: string }) {
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("posts");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profiles/${anonId}`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Not found");
        setData(json);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [anonId]);

  if (loading) {
    return <p className="text-sm text-muted">Loading profile…</p>;
  }
  if (error || !data) {
    return (
      <div className="space-y-3">
        <p className="text-muted">Profile not found{error ? `: ${error}` : ""}.</p>
        <Link href="/" className="text-sm text-amber hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  const { profile, counts, posts, reactions } = data;

  return (
    <div className="space-y-8">
      <header className="border-b border-line pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Anonymous profile
        </p>
        <h1 className="font-display mt-2 break-words text-3xl text-navy sm:text-4xl">
          {profile.label}
        </h1>
        <p className="mt-2 break-all font-mono text-sm text-amber">{profile.anonId}</p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          This ID is public and anonymous. No phone number, name, or personal
          details are shown — only posts and reactions tied to this anonymity
          ID.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="font-display text-2xl text-navy">{counts.posts}</p>
            <p className="text-xs uppercase tracking-wider text-muted">Posts</p>
          </div>
          <div>
            <p className="font-display text-2xl text-navy">{counts.reactions}</p>
            <p className="text-xs uppercase tracking-wider text-muted">
              Reactions
            </p>
          </div>
          <div>
            <p className="text-sm text-navy">{fmt(String(profile.memberSince))}</p>
            <p className="text-xs uppercase tracking-wider text-muted">
              Member since
            </p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 border-b border-line">
        {(
          [
            ["posts", "Posts"],
            ["reactions", "Reactions"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm ${
              tab === id
                ? "border-b-2 border-amber font-medium text-navy"
                : "text-muted hover:text-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="space-y-10">
          <Section title="Memes" empty="No memes posted yet.">
            {posts.memes.map((m) => (
              <Link
                key={m.id}
                href={m.href}
                className="flex gap-4 border-b border-line py-4 hover:bg-sand/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.imageUrl}
                  alt=""
                  className="h-16 w-16 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy">{m.title}</p>
                  <p className="text-xs text-muted">
                    ↑ {m.upvotes} · ↓ {m.downvotes} · {fmt(String(m.createdAt))}
                  </p>
                  {m.tags.length > 0 && (
                    <p className="mt-1 text-xs text-amber">
                      {m.tags.map((t) => `#${t}`).join(" ")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </Section>

          <Section title="Reports" empty="No reports posted yet.">
            {posts.reports.map((r) => (
              <Row
                key={r.id}
                href={r.href}
                title={`[${r.type}] ${r.title}`}
                meta={`↑ ${r.upvotes} · ${fmt(String(r.createdAt))}`}
              />
            ))}
          </Section>

          <Section title="Demands" empty="No demands raised yet.">
            {posts.demands.map((d) => (
              <Row
                key={d.id}
                href={d.href}
                title={d.title}
                meta={`${d.supportCount} supporters · ${fmt(String(d.createdAt))}`}
              />
            ))}
          </Section>

          <Section title="Notices" empty="No notices raised yet.">
            {posts.notices.map((n) => (
              <Row
                key={n.id}
                href={n.href}
                title={n.title}
                meta={`${n.target} · ${n.signatures} signatures · ${fmt(String(n.createdAt))}`}
              />
            ))}
          </Section>

          <Section title="Discussions" empty="No discussions yet.">
            {posts.discussions.map((d) => (
              <Row
                key={d.id}
                href={d.href}
                title={d.body.slice(0, 120)}
                meta={`${d.kind} · ${fmt(String(d.createdAt))}`}
              />
            ))}
          </Section>
        </div>
      )}

      {tab === "reactions" && (
        <div className="space-y-10">
          <Section title="Meme votes" empty="No meme votes yet.">
            {reactions.memeVotes.map((v) => (
              <Row
                key={v.id}
                href={v.href}
                title={v.title}
                meta={`${v.choice} · ${fmt(String(v.createdAt))}`}
              />
            ))}
          </Section>

          <Section title="Report reactions" empty="No report reactions yet.">
            {reactions.reportReactions.map((r) => (
              <Row
                key={r.id}
                href={r.href}
                title={r.title}
                meta={`${r.reaction} · ${fmt(String(r.createdAt))}`}
              />
            ))}
          </Section>

          <Section title="Report votes" empty="No report votes yet.">
            {reactions.reportVotes.map((v) => (
              <Row
                key={v.id}
                href={v.href}
                title={v.title}
                meta={`${v.choice} · ${fmt(String(v.createdAt))}`}
              />
            ))}
          </Section>

          <Section title="Demands supported" empty="No demand supports yet.">
            {reactions.demandSupports.map((s) => (
              <Row
                key={s.id}
                href={s.href}
                title={s.title}
                meta={`supported · ${fmt(String(s.createdAt))}`}
              />
            ))}
          </Section>

          <Section title="Proposal votes" empty="No proposal votes yet.">
            {reactions.proposalVotes.map((v) => (
              <Row
                key={v.id}
                href={v.href}
                title={v.title}
                meta={`voted · ${fmt(String(v.createdAt))}`}
              />
            ))}
          </Section>

          <Section title="Notice signatures" empty="No signatures yet.">
            {reactions.noticeSignatures.map((s) => (
              <Row
                key={s.id}
                href={s.href}
                title={s.title}
                meta={`signed · ${fmt(String(s.createdAt))}`}
              />
            ))}
          </Section>
        </div>
      )}

      <p className="text-xs text-muted">
        Profile of <AuthorLink anonId={profile.anonId} label={profile.label} />
        . Phone number is never shown.
      </p>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : [children].filter(Boolean);
  const count = items.length;
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      {count === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <div className="mt-2 border-t border-line">{children}</div>
      )}
    </section>
  );
}

function Row({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="block border-b border-line py-3 hover:bg-sand/30"
    >
      <p className="text-sm font-medium text-navy">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{meta}</p>
    </Link>
  );
}
