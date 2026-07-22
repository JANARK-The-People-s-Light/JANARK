"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SignPetitionButton } from "@/components/SignPetitionButton";
import { portalHref } from "@/lib/paths";

type Petition = {
  id: string;
  title: string;
  body: string;
  ask: string;
  target: string;
  targetDetail?: string | null;
  status: string;
  locationLevel: string;
  locationLabel: string;
  authorLabel: string;
  supportCount: number;
  createdAt: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
};

function PetitionsInner() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const liveOnly = search.get("live") !== "0";

  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (level) params.set("level", level);
    if (liveOnly) params.set("live", "1");
    const res = await fetch(`/api/demands?${params}`, { cache: "no-store" });
    const data = await res.json();
    setPetitions(data.demands ?? []);
    setLoading(false);
  }, [q, level, liveOnly]);

  useEffect(() => {
    load();
  }, [load]);

  function setLiveFilter(live: boolean) {
    const params = new URLSearchParams(search.toString());
    if (live) params.delete("live");
    else params.set("live", "0");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Collective will · live
          </p>
          <h1 className="font-display mt-1 text-3xl text-navy sm:text-4xl">
            Petitions
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Sign with your full name, ZIP / postal code, and verified phone —
            so every signature carries geographic relevance.
          </p>
        </div>
        <Link
          href={portalHref("/petitions/new")}
          className="bg-amber px-4 py-2.5 text-sm font-semibold text-navy"
        >
          Launch petition
        </Link>
      </div>

      <div
        className="mt-8 flex flex-wrap gap-2 border-b border-line pb-0"
        role="tablist"
        aria-label="Petition filters"
      >
        <button
          type="button"
          role="tab"
          aria-selected={liveOnly}
          onClick={() => setLiveFilter(true)}
          className={`border-b-2 px-3 py-2 text-sm transition ${
            liveOnly
              ? "border-amber font-semibold text-navy"
              : "border-transparent text-muted hover:text-navy"
          }`}
        >
          Open for signatures
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!liveOnly}
          onClick={() => setLiveFilter(false)}
          className={`border-b-2 px-3 py-2 text-sm transition ${
            !liveOnly
              ? "border-amber font-semibold text-navy"
              : "border-transparent text-muted hover:text-navy"
          }`}
        >
          All
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All levels</option>
          <option value="town">Town</option>
          <option value="city">City</option>
          <option value="district">District</option>
          <option value="state">State</option>
          <option value="national">Nation</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search petitions…"
          className="w-full min-w-0 flex-1 border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber sm:min-w-[200px]"
        />
        <button
          type="button"
          onClick={load}
          className="min-h-11 bg-navy px-4 py-2 text-sm text-cream"
        >
          Search
        </button>
      </div>

      <div className="mt-10 divide-y divide-line border-y border-line">
        {loading && <p className="py-8 text-sm text-muted">Loading…</p>}
        {!loading && petitions.length === 0 && (
          <p className="py-8 text-sm text-muted">
            No petitions yet.{" "}
            <Link
              href={portalHref("/petitions/new")}
              className="text-amber hover:underline"
            >
              Start the first one
            </Link>
            .
          </p>
        )}
        {petitions.map((p) => {
          const isLive = p.status === "open" || p.status === "gathering";
          return (
            <article key={p.id} className="py-5">
              <Link
                href={portalHref(`/petitions/${p.id}`)}
                className="block transition hover:opacity-90"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
                  <span className="text-saffron">petition</span>
                  <span>{p.status}</span>
                  <span>{p.locationLevel}</span>
                  <span>{p.locationLabel}</span>
                </div>
                <h2 className="font-display mt-1 text-xl text-navy">
                  {p.title}
                </h2>
                <p className="mt-2 text-sm font-medium text-navy/80">
                  Ask: {p.ask}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{p.body}</p>
                {p.mediaUrl ? (
                  <div className="mt-3 max-w-sm overflow-hidden">
                    {p.mediaType === "video" ? (
                      <video
                        src={p.mediaUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="max-h-40 w-full object-contain"
                        onClick={(e) => e.preventDefault()}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.mediaUrl}
                        alt=""
                        className="max-h-40 w-full object-contain"
                        loading="lazy"
                      />
                    )}
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-muted">{p.authorLabel}</p>
              </Link>
              {isLive ? (
                <div className="mt-3">
                  <SignPetitionButton
                    demandId={p.id}
                    initialCount={p.supportCount}
                    compact
                    onSigned={(n) =>
                      setPetitions((list) =>
                        list.map((x) =>
                          x.id === p.id ? { ...x, supportCount: n } : x,
                        ),
                      )
                    }
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted">
                  {p.supportCount.toLocaleString("en-IN")} signatures · closed
                  for new signatures
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function PetitionsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      }
    >
      <PetitionsInner />
    </Suspense>
  );
}
