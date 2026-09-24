"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { rules, templates } from "@/lib/config";
import { portalHref } from "@/lib/paths";

type Person = {
  anonId: string;
  label: string;
  followers: number;
  viewerFollows: boolean;
};

/**
 * Left-rail “Rising voices” suggestions — after primary nav.
 * Suggestions + copy/limits from config; follow uses the same API as profiles.
 */
export function WhoToFollow({ onNavigate }: { onNavigate?: () => void }) {
  const { ensureAuth, session } = useAuth();
  const copy = templates.portal();
  const cfg = rules.portal().followSuggestions;
  const [people, setPeople] = useState<Person[]>([]);
  const [ready, setReady] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/follow/suggestions", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const text = await res.text();
      const data = text
        ? (JSON.parse(text) as { people?: Person[] })
        : { people: [] };
      setPeople(
        (data.people ?? []).slice(0, Number(cfg.maxPeople)).map((p) => ({
          ...p,
          viewerFollows: Boolean(p.viewerFollows),
        })),
      );
    } catch {
      setPeople([]);
    } finally {
      setReady(true);
    }
  }, [cfg.maxPeople]);

  useEffect(() => {
    void load();
    const t = setInterval(load, Number(cfg.pollIntervalMs));
    return () => clearInterval(t);
  }, [load, cfg.pollIntervalMs, session?.anonId]);

  const toggle = useCallback(
    async (person: Person) => {
      const key = ensureAuth(copy.whoToFollowAuthReason);
      if (!key) return;
      setBusyId(person.anonId);
      try {
        const res = await fetch("/api/follow", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anonId: person.anonId,
            action: person.viewerFollows ? "unfollow" : "follow",
            website: "",
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          viewerFollows?: boolean;
        };
        if (!res.ok) return;
        const next = Boolean(data.viewerFollows);
        if (next) {
          // Drop from suggestions once followed
          setPeople((prev) => prev.filter((p) => p.anonId !== person.anonId));
          void load();
        } else {
          setPeople((prev) =>
            prev.map((p) =>
              p.anonId === person.anonId ? { ...p, viewerFollows: next } : p,
            ),
          );
        }
      } finally {
        setBusyId(null);
      }
    },
    [copy.whoToFollowAuthReason, ensureAuth, load],
  );

  return (
    <section
      className="mt-6"
      aria-label={copy.whoToFollowAriaLabel}
    >
      <p className="mb-2 flex items-center gap-2 px-3 font-display text-sm font-semibold tracking-tight text-navy">
        <span
          className="h-3.5 w-0.5 shrink-0 rounded-full bg-amber"
          aria-hidden
        />
        {copy.whoToFollowTitle}
      </p>
      {!ready ? (
        <p className="px-3 text-sm text-muted">{copy.whoToFollowLoading}</p>
      ) : people.length === 0 ? (
        <p className="px-3 text-sm leading-relaxed text-muted">
          {copy.whoToFollowEmpty}
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {people.map((p) => {
            const following = p.viewerFollows;
            const showUnfollow = following && hoverId === p.anonId;
            return (
              <li
                key={p.anonId}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              >
                <Link
                  href={portalHref(`/u/${p.anonId}`)}
                  onClick={onNavigate}
                  className="min-w-0 flex-1 truncate font-mono text-xs text-navy/80 hover:text-link"
                  title={p.anonId}
                >
                  {p.anonId}
                </Link>
                <button
                  type="button"
                  disabled={busyId === p.anonId}
                  onClick={() => void toggle(p)}
                  onMouseEnter={() => following && setHoverId(p.anonId)}
                  onMouseLeave={() => setHoverId(null)}
                  className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold transition disabled:opacity-60 ${
                    following
                      ? showUnfollow
                        ? "border border-danger bg-white text-danger"
                        : "border border-line bg-white text-navy"
                      : "bg-amber text-on-amber hover:bg-amber-bright"
                  }`}
                >
                  {busyId === p.anonId
                    ? copy.whoToFollowBusy
                    : following
                      ? showUnfollow
                        ? copy.whoToFollowUnfollow
                        : copy.whoToFollowFollowing
                      : copy.whoToFollowFollow}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
