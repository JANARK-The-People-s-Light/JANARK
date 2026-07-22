"use client";

import Link from "next/link";
import { portalHref } from "@/lib/paths";
import { useCallback, useEffect, useState } from "react";
import { AuthorLink } from "@/components/AuthorLink";
import { FollowButton } from "@/components/FollowButton";

type ProfilePayload = {
  profile: { anonId: string; label: string; memberSince: string };
  counts: {
    posts: number;
    reactions: number;
    followers?: number;
    following?: number;
    memberSince: string;
  };
  follow?: { viewerFollows: boolean; isSelf: boolean };
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
type PeopleList = "followers" | "following" | null;

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
  const [peopleList, setPeopleList] = useState<PeopleList>(null);
  const [people, setPeople] = useState<Array<{ anonId: string; label: string }>>(
    [],
  );
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [viewerFollows, setViewerFollows] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profiles/${anonId}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Not found");
        setData(json);
        setFollowers(Number(json.counts?.followers ?? 0));
        setFollowingCount(Number(json.counts?.following ?? 0));
        setViewerFollows(Boolean(json.follow?.viewerFollows));
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [anonId]);

  const openPeople = useCallback(
    async (list: "followers" | "following") => {
      setPeopleList(list);
      setPeopleLoading(true);
      try {
        const res = await fetch(
          `/api/follow?anonId=${encodeURIComponent(anonId)}&list=${list}`,
          { cache: "no-store", credentials: "same-origin" },
        );
        const json = await res.json();
        if (res.ok) {
          setPeople(json.people ?? []);
          setFollowers(Number(json.followers ?? followers));
          setFollowingCount(Number(json.followingCount ?? followingCount));
        }
      } finally {
        setPeopleLoading(false);
      }
    },
    [anonId, followers, followingCount],
  );

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

  const { profile, counts, posts, reactions, follow } = data;
  const isSelf = Boolean(follow?.isSelf);

  return (
    <div className="space-y-8">
      <header className="border-b border-line pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Anonymous profile
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display break-words text-3xl text-navy sm:text-4xl">
              {profile.label}
            </h1>
            <p className="mt-2 break-all font-mono text-sm text-amber">
              {profile.anonId}
            </p>
          </div>
          <FollowButton
            key={`${anonId}-${viewerFollows}`}
            targetAnonId={profile.anonId}
            initialFollowing={viewerFollows}
            isSelf={isSelf}
            onChange={(s) => {
              setViewerFollows(s.viewerFollows);
              setFollowers(s.followers);
              setFollowingCount(s.followingCount);
            }}
          />
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          This ID is public and anonymous. No phone number, name, or personal
          details are shown — only posts and reactions tied to this anonymity
          ID. Follow to keep up with their civic posts.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="font-display text-2xl text-navy">{counts.posts}</p>
            <p className="text-xs uppercase tracking-wider text-muted">Posts</p>
          </div>
          <button
            type="button"
            onClick={() => void openPeople("followers")}
            className="text-left transition hover:opacity-80"
          >
            <p className="font-display text-2xl text-navy">{followers}</p>
            <p className="text-xs uppercase tracking-wider text-muted">
              Followers
            </p>
          </button>
          <button
            type="button"
            onClick={() => void openPeople("following")}
            className="text-left transition hover:opacity-80"
          >
            <p className="font-display text-2xl text-navy">{followingCount}</p>
            <p className="text-xs uppercase tracking-wider text-muted">
              Following
            </p>
          </button>
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

        {peopleList ? (
          <div className="mt-6 border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
                {peopleList === "followers" ? "Followers" : "Following"}
              </h2>
              <button
                type="button"
                onClick={() => setPeopleList(null)}
                className="text-xs text-muted hover:text-navy"
              >
                Close
              </button>
            </div>
            {peopleLoading ? (
              <p className="mt-4 text-sm text-muted">Loading…</p>
            ) : people.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No one here yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {people.map((p) => (
                  <li key={p.anonId}>
                    <Link
                      href={portalHref(`/u/${p.anonId}`)}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-sand/40"
                      onClick={() => setPeopleList(null)}
                    >
                      <span>
                        <span className="block text-sm font-medium text-navy">
                          {p.label}
                        </span>
                        <span className="font-mono text-xs text-amber">
                          {p.anonId}
                        </span>
                      </span>
                      <span className="text-xs text-muted">View</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
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

          <Section title="Petitions" empty="No petitions raised yet.">
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

          <Section title="Petitions signed" empty="No petition signatures yet.">
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
      href={portalHref(href)}
      className="block border-b border-line py-3 hover:bg-sand/30"
    >
      <p className="text-sm font-medium text-navy">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{meta}</p>
    </Link>
  );
}
