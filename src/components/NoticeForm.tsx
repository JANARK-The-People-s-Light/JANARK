"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoBadge } from "@/components/Ui";
import { useAuth } from "@/components/AuthModal";
import { MediaAttach } from "@/components/MediaAttach";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

const TARGETS = [
  { value: "national", label: "National / Union" },
  { value: "state", label: "State" },
  { value: "district", label: "District" },
  { value: "institution", label: "Institution / Body" },
] as const;

export function NoticeForm() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [target, setTarget] = useState("national");
  const [targetDetail, setTargetDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    const voterKey = ensureAuth("publish this notice");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          target,
          targetDetail: targetDetail.trim() || undefined,
          voterKey,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not publish notice");
        return;
      }
      router.push(portalHref(`/notice/${data.notice.id}`));
    } catch {
      setError("Network error — check the database connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl text-navy sm:text-3xl">
          Raise a notice
        </h1>
        <DemoBadge />
      </div>
      <p className="text-sm leading-relaxed text-muted">
        Browse and draft freely. When you publish, we ask for a phone OTP and
        keep complete anonymity — your number is never shown.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
          Title
        </span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2.5 text-navy outline-none focus:border-amber"
          placeholder="What needs attention?"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
          Description
        </span>
        <textarea
          required
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2.5 text-navy outline-none focus:border-amber"
          placeholder="Facts, context, and what you want citizens to notice…"
        />
      </label>

      <MediaAttach value={mediaUrl} onChange={setMediaUrl} />

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
          Target
        </span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2.5 text-navy outline-none focus:border-amber"
        >
          {TARGETS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
          Target detail
        </span>
        <input
          value={targetDetail}
          onChange={(e) => setTargetDetail(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2.5 text-navy outline-none focus:border-amber"
          placeholder="e.g. District collector, State health dept…"
        />
      </label>

      <PostTermsAccept
        accepted={acceptedTerms}
        onAcceptedChange={setAcceptedTerms}
      />

      <button
        type="submit"
        disabled={saving || !acceptedTerms}
        className="bg-amber px-6 py-3 text-sm font-semibold text-navy transition hover:bg-amber-bright disabled:opacity-60"
      >
        {saving ? "Publishing…" : "Publish notice"}
      </button>
    </form>
  );
}
