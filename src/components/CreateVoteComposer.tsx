"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthModal";
import {
  CivicCreateShell,
  CreateMore,
  CreateSpacer,
  createBodyClass,
  createQuietInputClass,
  createTitleClass,
} from "@/components/CivicCreateShell";
import { IconPlus } from "@/components/Icons";
import { MediaAttach } from "@/components/MediaAttach";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useCreateDraft } from "@/components/useCreateDraft";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

const DRAFT_KEY = "janark-vote-draft-v1";

const VOTE_FORMATS = [
  { id: "yes_no", label: "Yes / No" },
  { id: "agree", label: "Agree / Neutral / Disagree" },
  { id: "multiple", label: "Multiple Choice" },
  { id: "rating", label: "Rating (1–5)" },
] as const;

type VoteFormatId = (typeof VOTE_FORMATS)[number]["id"];

type DraftState = {
  title: string;
  description: string;
  format: VoteFormatId;
  optionsText: string;
  audience: "national" | "area";
  durationDays: number;
  issueSlug: string;
  city: string;
  state: string;
  country: string;
  mediaUrl: string;
  hashtags: string[];
};

const EMPTY_DRAFT: DraftState = {
  title: "",
  description: "",
  format: "yes_no",
  optionsText: "",
  audience: "national",
  durationDays: 7,
  issueSlug: "",
  city: "",
  state: "",
  country: "India",
  mediaUrl: "",
  hashtags: [],
};

function choicesFor(format: VoteFormatId, optionsText: string) {
  if (format === "yes_no") return ["Yes", "No"];
  if (format === "agree") return ["Agree", "Neutral", "Disagree"];
  if (format === "rating") return ["1", "2", "3", "4", "5"];
  return optionsText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function CreateVoteComposer() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const { draft, patch, draftNote, saveDraftNow, clearDraft, hydrated } =
    useCreateDraft(DRAFT_KEY, EMPTY_DRAFT);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [issues, setIssues] = useState<{ slug: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();
  const titleRef = useRef<HTMLTextAreaElement>(null);

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

  const choices = useMemo(
    () => choicesFor(draft.format, draft.optionsText),
    [draft.format, draft.optionsText],
  );

  const insights = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (draft.title.trim().length < 6) return items;
    items.push({
      label: "Audience",
      value:
        draft.audience === "national"
          ? "Everyone in India"
          : [draft.city, draft.state || "your area"].filter(Boolean).join(", ") ||
            "My area",
    });
    items.push({
      label: "Format",
      value: VOTE_FORMATS.find((f) => f.id === draft.format)?.label ?? "",
    });
    if (draft.hashtags.length) {
      items.push({
        label: "Topics",
        value: draft.hashtags.map((t) => `#${t}`).join(" "),
      });
    }
    const words = `${draft.title} ${draft.description}`.trim().split(/\s+/).length;
    items.push({
      label: "Reading time",
      value: `~${Math.max(1, Math.ceil(words / 3))} sec`,
    });
    return items;
  }, [draft]);

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms to publish.");
      return;
    }
    const title = draft.title.trim();
    if (!title) {
      setError("Add a question people can vote on.");
      titleRef.current?.focus();
      return;
    }
    if (draft.format === "multiple" && choices.length < 2) {
      setError("Add at least two choices.");
      return;
    }
    const voterKey = ensureAuth("publish this vote");
    if (!voterKey) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description:
            draft.description.trim() ||
            `Open civic vote · ${VOTE_FORMATS.find((f) => f.id === draft.format)?.label}`,
          voteType: "preference",
          options: choices,
          issueSlug: draft.issueSlug || undefined,
          benefits: ["Citizen mandate", "Public visibility"],
          argumentsFor: ["Open civic participation"],
          argumentsAgainst: ["Needs verification at scale"],
          locationLevel: draft.audience === "national" ? "national" : "city",
          city: draft.audience === "area" ? draft.city || undefined : undefined,
          state: draft.audience === "area" ? draft.state || undefined : undefined,
          country: draft.country || "India",
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
      router.push(portalHref(`/vote/${data.proposal.id}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const preview = (
    <>
      <p className="font-display text-xl leading-snug text-navy">
        {draft.title.trim()}
      </p>
      <div className="mt-5 space-y-2">
        {choices.map((c) => (
          <div
            key={c}
            className="flex items-center gap-3 rounded-xl bg-cream/70 px-3 py-2.5 text-sm"
          >
            <span className="size-3.5 rounded-full border border-navy/25" />
            {c}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <CivicCreateShell
      intent="What question should people vote on?"
      support="One clear question. Everything else is optional."
      backHref={portalHref("/vote")}
      backLabel="Votes"
      error={error}
      onSubmit={onPublish}
      preview={preview}
      hasPreviewContent={draft.title.trim().length > 3}
      insights={insights}
      acceptedTerms={acceptedTerms}
      onAcceptedChange={setAcceptedTerms}
      termsId="vote-terms"
      draftNote={draftNote}
      onSaveDraft={saveDraftNow}
      publishLabel="Publish vote"
      publishing={saving}
      canPublish={acceptedTerms && Boolean(draft.title.trim())}
    >
      <label className="block">
        <span className="sr-only">Question</span>
        <textarea
          ref={titleRef}
          required
          rows={2}
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Should Bengaluru ban single-use plastics?"
          className={createTitleClass}
        />
      </label>

      <CreateSpacer size="sm" />

      <label className="block">
        <span className="sr-only">Context</span>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Add context (optional)"
          className={createBodyClass}
        />
      </label>

      <CreateSpacer />

      {!mediaOpen && !draft.mediaUrl ? (
        <button
          type="button"
          onClick={() => setMediaOpen(true)}
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-navy"
        >
          <IconPlus className="h-4 w-4" />
          Photo
        </button>
      ) : (
        <MediaAttach
          value={draft.mediaUrl}
          onChange={(url) => {
            patch({ mediaUrl: url });
            if (!url) setMediaOpen(false);
          }}
          collapsed={false}
          label="Photo"
        />
      )}

      <CreateSpacer />

      <CreateMore
        summary={`More · ${VOTE_FORMATS.find((f) => f.id === draft.format)?.label} · ${
          draft.audience === "national" ? "Everyone" : "My area"
        }`}
      >
        <fieldset>
          <legend className="text-sm text-navy">Vote format</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {VOTE_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => patch({ format: f.id })}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  draft.format === f.id
                    ? "bg-navy text-cream"
                    : "bg-sand/50 text-navy hover:bg-sand"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {draft.format === "multiple" ? (
            <textarea
              rows={3}
              value={draft.optionsText}
              onChange={(e) => patch({ optionsText: e.target.value })}
              placeholder={"Option A\nOption B"}
              className={`${createQuietInputClass} mt-4`}
            />
          ) : null}
        </fieldset>

        <label className="block">
          <span className="text-sm text-navy">Audience</span>
          <select
            value={draft.audience}
            onChange={(e) =>
              patch({ audience: e.target.value as "national" | "area" })
            }
            className={createQuietInputClass}
          >
            <option value="national">Everyone</option>
            <option value="area">My area</option>
          </select>
        </label>

        {draft.audience === "area" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={draft.city}
              onChange={(e) => patch({ city: e.target.value })}
              placeholder="City"
              className={createQuietInputClass}
            />
            <input
              value={draft.state}
              onChange={(e) => patch({ state: e.target.value })}
              placeholder="State"
              className={createQuietInputClass}
            />
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm text-navy">Linked issue</span>
          <SearchableSelect
            value={draft.issueSlug}
            onChange={(v) => patch({ issueSlug: v })}
            options={issues.map((i) => ({ value: i.slug, label: i.title }))}
            emptyLabel="None"
            searchPlaceholder="Search issues…"
            searchable
            aria-label="Linked issue"
          />
          {issues.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              <Link href={portalHref("/issues/new")} className="text-amber hover:underline">
                Raise an issue
              </Link>
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm text-navy">Topics</span>
          <input
            value={draft.hashtags.join(" ")}
            onChange={(e) =>
              patch({
                hashtags: e.target.value
                  .split(/[\s,]+/)
                  .map((t) => t.replace(/^#/, "").trim())
                  .filter(Boolean)
                  .slice(0, 12),
              })
            }
            placeholder="#environment #plastic"
            className={createQuietInputClass}
          />
        </label>
      </CreateMore>
    </CivicCreateShell>
  );
}
