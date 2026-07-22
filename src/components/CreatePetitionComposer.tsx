"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthModal";
import {
  CivicCreateShell,
  CreateMore,
  CreateSpacer,
  createBodyClass,
  createQuietInputClass,
  createTitleClass,
} from "@/components/CivicCreateShell";
import { IconMapPin, IconPlus } from "@/components/Icons";
import { MediaAttach } from "@/components/MediaAttach";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useCreateDraft } from "@/components/useCreateDraft";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import {
  PETITION_CATEGORIES,
  PETITION_TOPIC_CHIPS,
  searchPetitionActors,
  type PetitionActor,
} from "@/lib/petition-actors";
import {
  placeFromGeocode,
  resolvePlace,
  type PlaceHierarchy,
} from "@/lib/report-detect";
import { portalHref } from "@/lib/paths";

const DRAFT_KEY = "janark-petition-draft-v1";

type DraftState = {
  title: string;
  actorName: string;
  actorTarget: string;
  why: string;
  mediaUrl: string;
  evidenceLink: string;
  category: string;
  audience: "area" | "everyone";
  placeLabel: string;
  placeManual: boolean;
  hashtags: string[];
  relatedIssueSlug: string;
};

const EMPTY_DRAFT: DraftState = {
  title: "",
  actorName: "",
  actorTarget: "government",
  why: "",
  mediaUrl: "",
  evidenceLink: "",
  category: "",
  audience: "area",
  placeLabel: "",
  placeManual: false,
  hashtags: [],
  relatedIssueSlug: "",
};

export function CreatePetitionComposer() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const { draft, patch, draftNote, saveDraftNow, clearDraft, hydrated } =
    useCreateDraft(DRAFT_KEY, EMPTY_DRAFT);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [actorQuery, setActorQuery] = useState("");
  const [actorOpen, setActorOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [place, setPlace] = useState<PlaceHierarchy | null>(null);
  const [issues, setIssues] = useState<{ slug: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const actorBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [hydrated]);

  useEffect(() => {
    fetch("/api/issues", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setIssues(d.issues ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!actorBoxRef.current?.contains(e.target as Node)) setActorOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!hydrated || draft.placeManual || draft.placeLabel) return;
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=12`,
            { headers: { Accept: "application/json" } },
          );
          if (!res.ok) throw new Error("geo");
          const data = (await res.json()) as { address?: Record<string, string> };
          const a = data.address ?? {};
          const resolved = placeFromGeocode({
            suburb: a.suburb,
            neighbourhood: a.neighbourhood,
            city: a.city || a.city_district,
            town: a.town,
            village: a.village,
            county: a.county || a.state_district,
            state: a.state,
            country: a.country,
          });
          setPlace(resolved);
          patch({ placeLabel: resolved.label });
        } catch {
          /* ignore */
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 600_000 },
    );
  }, [hydrated, draft.placeManual, draft.placeLabel, patch]);

  useEffect(() => {
    if (!draft.placeLabel.trim()) {
      setPlace(null);
      return;
    }
    setPlace(resolvePlace(draft.placeLabel));
  }, [draft.placeLabel]);

  const actorSuggestions = useMemo(
    () => searchPetitionActors(actorQuery || draft.actorName, 8),
    [actorQuery, draft.actorName],
  );

  function pickActor(actor: PetitionActor) {
    patch({ actorName: actor.name, actorTarget: actor.target });
    setActorQuery(actor.name);
    setActorOpen(false);
    if (actor.region && !draft.placeLabel) patch({ placeLabel: actor.region });
  }

  const insights = useMemo(() => {
    if (draft.title.trim().length < 6) return [];
    const items: { label: string; value: string }[] = [];
    if (draft.actorName || actorQuery)
      items.push({
        label: "Target",
        value: draft.actorName || actorQuery,
      });
    if (draft.placeLabel)
      items.push({ label: "Location", value: draft.placeLabel });
    if (draft.category) items.push({ label: "Category", value: draft.category });
    if (draft.hashtags.length)
      items.push({
        label: "Topics",
        value: draft.hashtags.map((t) => `#${t}`).join(" "),
      });
    items.push({ label: "Supporters", value: "0 so far" });
    return items;
  }, [draft, actorQuery]);

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms to launch.");
      return;
    }
    const title = draft.title.trim();
    if (!title) {
      setError("What change are you asking for?");
      titleRef.current?.focus();
      return;
    }
    const actorName = draft.actorName.trim() || actorQuery.trim();
    if (!actorName) {
      setError("Who should act?");
      setActorOpen(true);
      return;
    }
    const voterKey = ensureAuth("launch this petition");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    const resolved =
      place ||
      (draft.placeLabel.trim() ? resolvePlace(draft.placeLabel) : null);
    const why =
      draft.why.trim() || `Citizens ask ${actorName} to act: ${title}`;
    try {
      const res = await fetch("/api/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ask: title,
          body: draft.evidenceLink.trim()
            ? `${why}\n\nEvidence: ${draft.evidenceLink.trim()}`
            : why,
          target: draft.actorTarget || "government",
          targetDetail: actorName,
          category: draft.category || undefined,
          locationLevel:
            draft.audience === "everyone"
              ? "national"
              : resolved?.locationLevel || "city",
          village: resolved?.village,
          town: resolved?.town,
          city: resolved?.city,
          district: resolved?.district,
          state: resolved?.state,
          country: resolved?.country || "India",
          mediaUrl: draft.mediaUrl.trim() || undefined,
          hashtags: draft.hashtags,
          anonymous: true,
          voterKey,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not launch");
        return;
      }
      clearDraft();
      router.push(portalHref(`/petitions/${data.demand.id}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CivicCreateShell
      intent="What change are you asking for?"
      support="Ask for a specific action from the people or organization that can make it happen."
      backHref={portalHref("/petitions")}
      backLabel="Petitions"
      error={error}
      onSubmit={onPublish}
      preview={
        <>
          <p className="font-display text-xl text-navy">{draft.title.trim()}</p>
          <p className="mt-4 text-sm text-muted">
            Target ·{" "}
            <span className="text-navy">{draft.actorName || actorQuery || "—"}</span>
          </p>
          <p className="mt-1 text-sm text-muted">0 supporters</p>
        </>
      }
      hasPreviewContent={draft.title.trim().length > 3}
      insights={insights}
      acceptedTerms={acceptedTerms}
      onAcceptedChange={setAcceptedTerms}
      termsId="petition-terms"
      draftNote={draftNote}
      onSaveDraft={saveDraftNow}
      publishLabel="Launch petition"
      publishing={saving}
      canPublish={
        acceptedTerms &&
        Boolean(draft.title.trim()) &&
        Boolean(draft.actorName.trim() || actorQuery.trim())
      }
    >
      <textarea
        ref={titleRef}
        required
        rows={2}
        value={draft.title}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder="Fix street lighting on Ring Road"
        className={createTitleClass}
      />

      <CreateSpacer size="sm" />

      <div ref={actorBoxRef} className="relative">
        <input
          value={actorQuery || draft.actorName}
          onChange={(e) => {
            setActorQuery(e.target.value);
            patch({ actorName: e.target.value, actorTarget: "institution" });
            setActorOpen(true);
          }}
          onFocus={() => setActorOpen(true)}
          placeholder="Who should act? Search BBMP, BESCOM…"
          className={createBodyClass}
          autoComplete="off"
        />
        {actorOpen ? (
          <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-line/80 bg-cream py-1 shadow-lg">
            {actorSuggestions.map((a) => (
              <li key={a.name}>
                <button
                  type="button"
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-sand/50"
                  onClick={() => pickActor(a)}
                >
                  <span className="text-sm text-navy">{a.name}</span>
                  {a.region ? (
                    <span className="text-[11px] text-muted">{a.region}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <CreateSpacer size="sm" />

      <textarea
        rows={3}
        value={draft.why}
        onChange={(e) => patch({ why: e.target.value })}
        placeholder="Why should this happen? (optional)"
        className={createBodyClass}
      />

      <CreateSpacer />

      {!evidenceOpen && !draft.mediaUrl.trim() && !draft.evidenceLink.trim() ? (
        <button
          type="button"
          onClick={() => setEvidenceOpen(true)}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-navy"
        >
          <IconPlus className="h-4 w-4" />
          Evidence
        </button>
      ) : (
        <div className="space-y-3">
          <MediaAttach
            value={draft.mediaUrl}
            onChange={(url) => {
              patch({ mediaUrl: url });
              if (!url && !draft.evidenceLink) setEvidenceOpen(false);
            }}
            collapsed={false}
            label="Evidence"
          />
          <input
            type="url"
            value={draft.evidenceLink}
            onChange={(e) => patch({ evidenceLink: e.target.value })}
            placeholder="Or paste a link"
            className={createQuietInputClass}
          />
        </div>
      )}

      <CreateSpacer />

      <div className="flex flex-wrap gap-2">
        {PETITION_TOPIC_CHIPS.map((tag) => {
          const on = draft.hashtags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() =>
                patch({
                  hashtags: on
                    ? draft.hashtags.filter((t) => t !== tag)
                    : [...draft.hashtags, tag].slice(0, 12),
                })
              }
              className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                on ? "bg-navy text-cream" : "bg-sand/50 text-navy hover:bg-sand"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <CreateSpacer />

      <CreateMore
        summary={`More · ${draft.category || "Category"} · ${
          draft.placeLabel || (locating ? "Locating…" : "Location")
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {PETITION_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => patch({ category: draft.category === c ? "" : c })}
              className={`rounded-full px-3 py-1.5 text-sm ${
                draft.category === c
                  ? "bg-navy text-cream"
                  : "bg-sand/50 text-navy hover:bg-sand"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="inline-flex items-center gap-1.5 text-sm text-navy">
            <IconMapPin className="h-3.5 w-3.5 text-muted" />
            Location
          </span>
          <input
            value={draft.placeLabel}
            onChange={(e) =>
              patch({ placeLabel: e.target.value, placeManual: true })
            }
            placeholder="Bengaluru…"
            className={createQuietInputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm text-navy">Related issue</span>
          <SearchableSelect
            value={draft.relatedIssueSlug}
            onChange={(v) => patch({ relatedIssueSlug: v })}
            options={issues.map((i) => ({ value: i.slug, label: i.title }))}
            emptyLabel="None"
            searchPlaceholder="Search issues…"
            searchable
            aria-label="Related issue"
          />
          {issues.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              <Link href={portalHref("/issues/new")} className="text-amber hover:underline">
                Raise an issue
              </Link>
            </p>
          ) : null}
        </label>
      </CreateMore>
    </CivicCreateShell>
  );
}
