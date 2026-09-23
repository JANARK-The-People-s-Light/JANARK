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
import { IconMapPin, IconPlus, IconUser } from "@/components/Icons";
import { MediaAttach } from "@/components/MediaAttach";
import { useCreateDraft } from "@/components/useCreateDraft";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";
import {
  MORE_REPORT_CATEGORIES,
  REPORT_CATEGORIES,
  categoryToApiType,
  detectReportHints,
  placeFromGeocode,
  resolvePlace,
  type PlaceHierarchy,
  type ReportPriority,
} from "@/lib/report-detect";

const DRAFT_KEY = "janark-report-draft-v1";

type DraftState = {
  title: string;
  body: string;
  categoryId: string;
  priority: ReportPriority;
  placeLabel: string;
  audience: "area" | "everyone";
  mediaUrl: string;
  hashtags: string[];
  categoryTouched: boolean;
  priorityTouched: boolean;
  topicsTouched: boolean;
  placeManual: boolean;
};

const EMPTY_DRAFT: DraftState = {
  title: "",
  body: "",
  categoryId: "",
  priority: "medium",
  placeLabel: "",
  audience: "area",
  mediaUrl: "",
  hashtags: [],
  categoryTouched: false,
  priorityTouched: false,
  topicsTouched: false,
  placeManual: false,
};

export function CreateReportComposer() {
  const router = useRouter();
  const { ensureAuth, session, refreshSession } = useAuth();
  const { draft, setDraft, patch, draftNote, saveDraftNow, clearDraft, hydrated } =
    useCreateDraft(DRAFT_KEY, EMPTY_DRAFT);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [moreCats, setMoreCats] = useState(false);
  const [locating, setLocating] = useState(false);
  const [place, setPlace] = useState<PlaceHierarchy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const applied = useRef({ category: "", priority: "", topics: "", place: "" });

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || draft.placeManual || draft.placeLabel) return;
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=16`,
            { headers: { Accept: "application/json" } },
          );
          if (!res.ok) throw new Error("geo");
          const data = (await res.json()) as { address?: Record<string, string> };
          const a = data.address ?? {};
          const resolved = placeFromGeocode({
            suburb: a.suburb,
            neighbourhood: a.neighbourhood || a.residential,
            city: a.city || a.city_district,
            town: a.town,
            village: a.village || a.hamlet,
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

  useEffect(() => {
    const text = `${draft.title}\n${draft.body}`;
    if (text.trim().length < 8) return;
    const hints = detectReportHints(text);
    if (
      hints.categoryId &&
      !draft.categoryTouched &&
      applied.current.category !== hints.categoryId
    ) {
      applied.current.category = hints.categoryId;
      patch({ categoryId: hints.categoryId });
    }
    if (
      hints.priority &&
      !draft.priorityTouched &&
      applied.current.priority !== hints.priority
    ) {
      applied.current.priority = hints.priority;
      patch({ priority: hints.priority });
    }
    if (
      hints.place &&
      !draft.placeManual &&
      !draft.placeLabel &&
      applied.current.place !== hints.place.label
    ) {
      applied.current.place = hints.place.label;
      patch({ placeLabel: hints.place.label });
      setPlace(hints.place);
    }
    if (!draft.topicsTouched && hints.topics.length) {
      const key = hints.topics.join(",");
      if (applied.current.topics !== key) {
        applied.current.topics = key;
        setDraft((prev) => ({
          ...prev,
          hashtags: [...new Set([...prev.hashtags, ...hints.topics])].slice(
            0,
            12,
          ),
        }));
      }
    }
  }, [
    draft.title,
    draft.body,
    draft.categoryTouched,
    draft.priorityTouched,
    draft.placeManual,
    draft.placeLabel,
    draft.topicsTouched,
    patch,
    setDraft,
  ]);

  const hints = useMemo(
    () => detectReportHints(`${draft.title}\n${draft.body}`),
    [draft.title, draft.body],
  );

  const categories = useMemo(() => {
    const primary = [...REPORT_CATEGORIES];
    return moreCats ? [...primary, ...MORE_REPORT_CATEGORIES] : primary;
  }, [moreCats]);

  const insights = useMemo(() => {
    if (draft.title.trim().length < 6) return [];
    const items: { label: string; value: string }[] = [];
    const cat =
      categories.find((c) => c.id === draft.categoryId)?.label ||
      hints.categoryLabel;
    if (cat) items.push({ label: "Category", value: cat });
    if (draft.placeLabel)
      items.push({ label: "Location", value: draft.placeLabel });
    items.push({
      label: "Priority",
      value: draft.priority.charAt(0).toUpperCase() + draft.priority.slice(1),
    });
    if (draft.hashtags.length)
      items.push({
        label: "Topics",
        value: draft.hashtags.map((t) => `#${t}`).join(" "),
      });
    return items;
  }, [draft, categories, hints.categoryLabel]);

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms to publish.");
      return;
    }
    const title = draft.title.trim();
    if (!title) {
      setError("What happened?");
      titleRef.current?.focus();
      return;
    }
    const voterKey = ensureAuth("publish this report");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    const categoryId = draft.categoryId || hints.categoryId || "other";
    const resolved =
      place ||
      (draft.placeLabel.trim() ? resolvePlace(draft.placeLabel) : null);
    const locationLevel =
      draft.audience === "everyone"
        ? "national"
        : resolved?.locationLevel || "city";
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: categoryToApiType(categoryId),
          title,
          body:
            draft.body.trim() ||
            (resolved ? `${title} — near ${resolved.label}.` : title),
          locationLevel,
          village: resolved?.village,
          town: resolved?.town,
          city: resolved?.city,
          block: resolved?.block,
          district: resolved?.district,
          state: resolved?.state,
          country: resolved?.country || "India",
          mediaUrl: draft.mediaUrl.trim() || undefined,
          hashtags: [...draft.hashtags, categoryId, `priority-${draft.priority}`],
          anonymous: true,
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
      router.push(portalHref(`/reports/${data.report.id}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CivicCreateShell
      intent="What happened?"
      support="Something happening now — local, concrete, evidence-driven."
      backHref={portalHref("/reports")}
      backLabel="Reports"
      error={error}
      onSubmit={onPublish}
      preview={
        <>
          <p className="font-display text-xl text-navy">{draft.title.trim()}</p>
          {draft.body.trim() ? (
            <p className="mt-3 text-sm text-navy/70">{draft.body.trim()}</p>
          ) : null}
        </>
      }
      hasPreviewContent={draft.title.trim().length > 3}
      insights={insights}
      acceptedTerms={acceptedTerms}
      onAcceptedChange={setAcceptedTerms}
      termsId="report-terms"
      draftNote={draftNote}
      onSaveDraft={saveDraftNow}
      publishLabel="Publish report"
      publishing={saving}
      canPublish={acceptedTerms && Boolean(draft.title.trim())}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <IconUser className="h-4 w-4" />
        <span>
          Posting as{" "}
          <span className="font-medium text-navy">
            {session?.anonId ?? "anonymous"}
          </span>
        </span>
        <span className="text-navy/30">·</span>
        <Link href={portalHref("/issues/new")} className="text-link hover:underline">
          Or raise an Issue
        </Link>
      </div>

      <textarea
        ref={titleRef}
        required
        rows={2}
        value={draft.title}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder="Water has been leaking on Church Street for two days."
        className={createTitleClass}
      />

      <CreateSpacer size="sm" />

      <textarea
        rows={3}
        value={draft.body}
        onChange={(e) => patch({ body: e.target.value })}
        placeholder="Tell us more (optional)"
        className={createBodyClass}
      />

      <CreateSpacer />

      {!photoOpen && !draft.mediaUrl.trim() ? (
        <button
          type="button"
          onClick={() => setPhotoOpen(true)}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-navy"
        >
          <IconPlus className="h-4 w-4" />
          Photos or video
        </button>
      ) : (
        <MediaAttach
          value={draft.mediaUrl}
          onChange={(url) => {
            patch({ mediaUrl: url });
            if (!url) setPhotoOpen(false);
          }}
          collapsed={false}
          label="Photos & video"
        />
      )}

      <CreateSpacer />

      <CreateMore
        summary={`More · ${
          categories.find((c) => c.id === draft.categoryId)?.label || "Category"
        } · ${draft.placeLabel || (locating ? "Locating…" : "Location")}`}
      >
        <div>
          <p className="text-sm text-navy">Category</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  patch({
                    categoryId: draft.categoryId === c.id ? "" : c.id,
                    categoryTouched: true,
                  })
                }
                className={`rounded-full px-3 py-1.5 text-sm ${
                  draft.categoryId === c.id
                    ? "bg-chrome text-on-chrome"
                    : "bg-sand/50 text-navy hover:bg-sand"
                }`}
              >
                {c.label}
              </button>
            ))}
            {!moreCats ? (
              <button
                type="button"
                onClick={() => setMoreCats(true)}
                className="rounded-full px-3 py-1.5 text-sm text-muted"
              >
                More
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-sm text-navy">Priority</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["low", "medium", "high", "emergency"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => patch({ priority: p, priorityTouched: true })}
                className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                  draft.priority === p
                    ? "bg-chrome text-on-chrome"
                    : "bg-sand/50 text-navy hover:bg-sand"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
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
            placeholder="Koramangala…"
            className={createQuietInputClass}
          />
          {place && (place.city || place.state) ? (
            <p className="mt-1 text-xs text-muted">
              {[place.city, place.state, place.country].filter(Boolean).join(" → ")}
            </p>
          ) : null}
        </label>
      </CreateMore>
    </CivicCreateShell>
  );
}
