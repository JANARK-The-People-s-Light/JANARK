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
import { useCreateDraft } from "@/components/useCreateDraft";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import {
  MORE_CATEGORIES,
  PRIMARY_CATEGORIES,
  detectIssueHints,
} from "@/lib/issue-detect";
import { portalHref } from "@/lib/paths";

const DRAFT_KEY = "janark-issue-draft-v1";

type DraftState = {
  title: string;
  summary: string;
  whyItMatters: string;
  category: string;
  locationLabel: string;
  locationManual: boolean;
  mediaUrl: string;
  hashtags: string[];
  categoryTouched: boolean;
  topicsTouched: boolean;
};

const EMPTY_DRAFT: DraftState = {
  title: "",
  summary: "",
  whyItMatters: "",
  category: "",
  locationLabel: "",
  locationManual: false,
  mediaUrl: "",
  hashtags: [],
  categoryTouched: false,
  topicsTouched: false,
};

export function CreateIssueComposer() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const { draft, setDraft, patch, draftNote, saveDraftNow, clearDraft, hydrated } =
    useCreateDraft(DRAFT_KEY, EMPTY_DRAFT);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [moreCats, setMoreCats] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const applied = useRef({ category: "", topics: "", location: "" });

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || draft.locationManual || draft.locationLabel) return;
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
          const data = (await res.json()) as {
            address?: { city?: string; town?: string; state?: string; suburb?: string };
          };
          const a = data.address ?? {};
          const label = [a.suburb, a.city || a.town, a.state]
            .filter(Boolean)
            .join(", ");
          if (label) patch({ locationLabel: label });
        } catch {
          /* ignore */
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 600_000 },
    );
  }, [hydrated, draft.locationManual, draft.locationLabel, patch]);

  useEffect(() => {
    const text = `${draft.title}\n${draft.summary}`;
    if (text.trim().length < 8) return;
    const hints = detectIssueHints(text);
    if (
      hints.category &&
      !draft.categoryTouched &&
      applied.current.category !== hints.category
    ) {
      applied.current.category = hints.category;
      patch({ category: hints.category });
    }
    if (
      hints.location &&
      !draft.locationManual &&
      !draft.locationLabel &&
      applied.current.location !== hints.location
    ) {
      applied.current.location = hints.location;
      patch({ locationLabel: hints.location });
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
    draft.summary,
    draft.categoryTouched,
    draft.locationManual,
    draft.locationLabel,
    draft.topicsTouched,
    patch,
    setDraft,
  ]);

  const hints = useMemo(
    () => detectIssueHints(`${draft.title}\n${draft.summary}`),
    [draft.title, draft.summary],
  );

  const insights = useMemo(() => {
    if (draft.title.trim().length < 6) return [];
    const items: { label: string; value: string }[] = [];
    const cat =
      PRIMARY_CATEGORIES.find((c) => c.id === draft.category)?.label ||
      draft.category ||
      hints.category;
    if (cat) items.push({ label: "Category", value: cat });
    if (draft.locationLabel)
      items.push({ label: "Location", value: draft.locationLabel });
    if (draft.hashtags.length)
      items.push({
        label: "Topics",
        value: draft.hashtags.map((t) => `#${t}`).join(" "),
      });
    return items;
  }, [draft, hints.category]);

  const cats = useMemo(() => {
    const primary = PRIMARY_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
    }));
    if (!moreCats) return primary;
    return [
      ...primary,
      ...MORE_CATEGORIES.filter(
        (c) => !PRIMARY_CATEGORIES.some((p) => p.id === c),
      ).map((c) => ({ id: c, label: c })),
    ];
  }, [moreCats]);

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms to publish.");
      return;
    }
    const title = draft.title.trim();
    if (!title) {
      setError("What’s the issue?");
      titleRef.current?.focus();
      return;
    }
    const voterKey = ensureAuth("publish this issue");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    const summary =
      draft.summary.trim() ||
      (draft.locationLabel ? `${title} · ${draft.locationLabel}` : title);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: draft.category || hints.category || "Infrastructure",
          summary,
          whyItMatters: draft.whyItMatters.trim() || summary,
          currentSituation: draft.locationLabel
            ? `Near ${draft.locationLabel}`
            : "Citizen-raised issue.",
          pros: [],
          cons: [],
          mediaUrl: draft.mediaUrl.trim() || undefined,
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
      router.push(portalHref(`/issues/${data.issue.slug}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CivicCreateShell
      intent="What's the issue?"
      support="A broader civic problem — lasting, community-driven. For something happening right now, file a Report."
      backHref={portalHref("/issues")}
      backLabel="Issues"
      error={error}
      onSubmit={onPublish}
      preview={
        <>
          <p className="font-display text-xl text-navy">{draft.title.trim()}</p>
          {draft.summary.trim() ? (
            <p className="mt-3 text-sm text-navy/70">{draft.summary.trim()}</p>
          ) : null}
        </>
      }
      hasPreviewContent={draft.title.trim().length > 3}
      insights={insights}
      acceptedTerms={acceptedTerms}
      onAcceptedChange={setAcceptedTerms}
      termsId="issue-terms"
      draftNote={draftNote}
      onSaveDraft={saveDraftNow}
      publishLabel="Publish issue"
      publishing={saving}
      canPublish={acceptedTerms && Boolean(draft.title.trim())}
    >
      <p className="mb-6 text-sm text-muted">
        Prefer something local and urgent?{" "}
        <Link href={portalHref("/reports/new")} className="text-amber hover:underline">
          File a report
        </Link>
      </p>

      <textarea
        ref={titleRef}
        required
        rows={2}
        value={draft.title}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder="Broken streetlights on MG Road"
        className={createTitleClass}
      />

      <CreateSpacer size="sm" />

      <textarea
        rows={3}
        value={draft.summary}
        onChange={(e) => patch({ summary: e.target.value })}
        placeholder="Why does it matter? (optional)"
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
          Photo
        </button>
      ) : (
        <MediaAttach
          value={draft.mediaUrl}
          onChange={(url) => {
            patch({ mediaUrl: url });
            if (!url) setPhotoOpen(false);
          }}
          collapsed={false}
          label="Photo"
        />
      )}

      <CreateSpacer />

      <CreateMore
        summary={`More · ${
          PRIMARY_CATEGORIES.find((c) => c.id === draft.category)?.label ||
          draft.category ||
          "Category"
        } · ${draft.locationLabel || (locating ? "Locating…" : "Location")}`}
      >
        <div>
          <p className="text-sm text-navy">Category</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c.id + c.label}
                type="button"
                onClick={() =>
                  patch({
                    category: draft.category === c.id ? "" : c.id,
                    categoryTouched: true,
                  })
                }
                className={`rounded-full px-3 py-1.5 text-sm ${
                  draft.category === c.id
                    ? "bg-navy text-cream"
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

        <label className="block">
          <span className="inline-flex items-center gap-1.5 text-sm text-navy">
            <IconMapPin className="h-3.5 w-3.5 text-muted" />
            Location
          </span>
          <input
            value={draft.locationLabel}
            onChange={(e) =>
              patch({ locationLabel: e.target.value, locationManual: true })
            }
            placeholder="Neighbourhood, city…"
            className={createQuietInputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm text-navy">Topics</span>
          <input
            value={draft.hashtags.map((t) => `#${t}`).join(" ")}
            onChange={(e) =>
              patch({
                topicsTouched: true,
                hashtags: e.target.value
                  .split(/[\s,]+/)
                  .map((t) => t.replace(/^#/, "").trim())
                  .filter(Boolean)
                  .slice(0, 12),
              })
            }
            placeholder="#roads #safety"
            className={createQuietInputClass}
          />
        </label>
      </CreateMore>
    </CivicCreateShell>
  );
}
