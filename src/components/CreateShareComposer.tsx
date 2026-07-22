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
} from "@/components/CivicCreateShell";
import { IconImage, IconMapPin } from "@/components/Icons";
import { MediaAttach } from "@/components/MediaAttach";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useCreateDraft } from "@/components/useCreateDraft";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";
import {
  placeFromGeocode,
  resolvePlace,
  type PlaceHierarchy,
} from "@/lib/report-detect";

const DRAFT_KEY = "janark-share-draft-v1";

const TOPIC_CHIPS = [
  "roads",
  "cleanup",
  "community",
  "progress",
  "event",
  "awareness",
] as const;

type DraftState = {
  caption: string;
  mediaUrl: string;
  locationLabel: string;
  placeManual: boolean;
  hashtags: string[];
  issueSlug: string;
  petitionId: string;
};

const EMPTY_DRAFT: DraftState = {
  caption: "",
  mediaUrl: "",
  locationLabel: "",
  placeManual: false,
  hashtags: [],
  issueSlug: "",
  petitionId: "",
};

export function CreateShareComposer() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const { draft, patch, draftNote, saveDraftNow, clearDraft, hydrated } =
    useCreateDraft(DRAFT_KEY, EMPTY_DRAFT);
  const [mediaOpen, setMediaOpen] = useState(true);
  const [locating, setLocating] = useState(false);
  const [place, setPlace] = useState<PlaceHierarchy | null>(null);
  const [issues, setIssues] = useState<{ slug: string; title: string }[]>([]);
  const [petitions, setPetitions] = useState<{ id: string; title: string }[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();
  const captionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      if (draft.mediaUrl) captionRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(t);
  }, [hydrated, draft.mediaUrl]);

  useEffect(() => {
    fetch("/api/issues", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setIssues(d.issues ?? []))
      .catch(() => {});
    fetch("/api/demands", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list = (d.demands ?? []) as { id: string; title: string }[];
        setPetitions(list.slice(0, 40));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated || draft.placeManual || draft.locationLabel) return;
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14`,
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
          patch({ locationLabel: resolved.label });
        } catch {
          /* ignore */
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 600_000 },
    );
  }, [hydrated, draft.placeManual, draft.locationLabel, patch]);

  useEffect(() => {
    if (!draft.locationLabel.trim()) {
      setPlace(null);
      return;
    }
    setPlace(resolvePlace(draft.locationLabel));
  }, [draft.locationLabel]);

  const insights = useMemo(() => {
    if (!draft.caption.trim() && !draft.mediaUrl) return [];
    const items: { label: string; value: string }[] = [];
    if (draft.locationLabel)
      items.push({ label: "Location", value: draft.locationLabel });
    if (draft.hashtags.length)
      items.push({
        label: "Topics",
        value: draft.hashtags.map((t) => `#${t}`).join(" "),
      });
    return items;
  }, [draft]);

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms to publish.");
      return;
    }
    if (!draft.mediaUrl.trim()) {
      setError("Add a photo or video — Share is media-first.");
      setMediaOpen(true);
      return;
    }
    const caption = draft.caption.trim();
    if (!caption) {
      setError("Add a short caption.");
      captionRef.current?.focus();
      return;
    }
    const voterKey = ensureAuth("share with the community");
    if (!voterKey) return;

    setSaving(true);
    setError(null);
    const resolved =
      place ||
      (draft.locationLabel.trim() ? resolvePlace(draft.locationLabel) : null);

    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          mediaUrl: draft.mediaUrl.trim(),
          locationLabel: draft.locationLabel.trim() || undefined,
          city: resolved?.city,
          district: resolved?.district,
          state: resolved?.state,
          country: resolved?.country || "India",
          issueSlug: draft.issueSlug || undefined,
          petitionId: draft.petitionId || undefined,
          hashtags: draft.hashtags,
          voterKey,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not publish");
        return;
      }
      clearDraft();
      router.push(portalHref(`/share/${data.share.id}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CivicCreateShell
      intent="Share something with your community"
      support="Civic observations, progress, events, awareness — not a lifestyle feed."
      backHref={portalHref("/")}
      backLabel="Feed"
      error={error}
      onSubmit={onPublish}
      preview={
        <>
          {draft.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.mediaUrl}
              alt=""
              className="mb-4 max-h-48 w-full rounded-xl object-cover"
            />
          ) : null}
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-navy">
            {draft.caption.trim() || (
              <span className="text-navy/30">Your caption appears here</span>
            )}
          </p>
        </>
      }
      hasPreviewContent={Boolean(draft.caption.trim() || draft.mediaUrl)}
      insights={insights}
      acceptedTerms={acceptedTerms}
      onAcceptedChange={setAcceptedTerms}
      termsId="share-terms"
      draftNote={draftNote}
      onSaveDraft={saveDraftNow}
      publishLabel="Publish"
      publishing={saving}
      canPublish={
        acceptedTerms &&
        Boolean(draft.caption.trim()) &&
        Boolean(draft.mediaUrl.trim())
      }
    >
      {!mediaOpen && !draft.mediaUrl.trim() ? (
        <button
          type="button"
          onClick={() => setMediaOpen(true)}
          className="flex w-full flex-col items-start gap-1 rounded-2xl border border-dashed border-line bg-sand/30 px-5 py-10 text-left transition hover:border-amber/50 hover:bg-sand/50"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-navy">
            <IconImage className="h-5 w-5 text-navy/60" />
            Add photos or videos
          </span>
          <span className="text-xs text-muted">
            Drag & drop · paste · upload — required for Share
          </span>
        </button>
      ) : (
        <MediaAttach
          value={draft.mediaUrl}
          onChange={(url) => {
            patch({ mediaUrl: url });
            if (!url) setMediaOpen(true);
            else captionRef.current?.focus();
          }}
          collapsed={false}
          required
          label="Photos or videos"
        />
      )}

      <CreateSpacer />

      <textarea
        ref={captionRef}
        rows={4}
        value={draft.caption}
        onChange={(e) => patch({ caption: e.target.value })}
        placeholder="Write a caption… What’s happening in your community?"
        className={createBodyClass}
      />

      <CreateSpacer size="sm" />

      <div className="flex flex-wrap gap-2">
        {TOPIC_CHIPS.map((tag) => {
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
              {!on ? <span className="text-muted"># </span> : "#"}
              {tag}
            </button>
          );
        })}
      </div>
      <input
        value={draft.hashtags.map((t) => `#${t}`).join(" ")}
        onChange={(e) =>
          patch({
            hashtags: e.target.value
              .split(/[\s,]+/)
              .map((t) => t.replace(/^#/, "").trim())
              .filter(Boolean)
              .slice(0, 12),
          })
        }
        placeholder="#roads #cleanup #bengaluru"
        className={createQuietInputClass}
      />

      <CreateSpacer />

      <label className="block">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
          <IconMapPin className="h-3.5 w-3.5" />
          {draft.locationLabel
            ? draft.locationLabel
            : locating
              ? "Detecting location…"
              : "Add location"}
        </span>
        <input
          value={draft.locationLabel}
          onChange={(e) =>
            patch({ locationLabel: e.target.value, placeManual: true })
          }
          placeholder="Neighbourhood or city"
          className={createQuietInputClass}
        />
      </label>

      <CreateSpacer />

      <CreateMore summary="Optional · tag issue or petition">
        <label className="block">
          <span className="text-sm text-navy">Tag an issue</span>
          <SearchableSelect
            value={draft.issueSlug}
            onChange={(v) => patch({ issueSlug: v })}
            options={issues.map((i) => ({ value: i.slug, label: i.title }))}
            emptyLabel="None"
            searchPlaceholder="Search issues…"
            searchable
            aria-label="Tag an issue"
          />
          {issues.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              <Link
                href={portalHref("/issues/new")}
                className="text-amber hover:underline"
              >
                Raise an issue
              </Link>
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm text-navy">Link a petition</span>
          <SearchableSelect
            value={draft.petitionId}
            onChange={(v) => patch({ petitionId: v })}
            options={petitions.map((p) => ({ value: p.id, label: p.title }))}
            emptyLabel="None"
            searchPlaceholder="Search petitions…"
            searchable
            aria-label="Link a petition"
          />
        </label>

        <p className="text-xs leading-relaxed text-muted">
          Later, this share can become a Report, Issue, Petition, or Discussion —
          start light, go deeper when it matters.
        </p>
      </CreateMore>
    </CivicCreateShell>
  );
}
