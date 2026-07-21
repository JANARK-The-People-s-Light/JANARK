"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { MediaAttach } from "@/components/MediaAttach";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

const CATEGORIES = [
  "Education",
  "Employment",
  "Healthcare",
  "Corruption",
  "Judiciary",
  "Women",
  "Agriculture",
  "Environment",
  "Infrastructure",
  "Police",
  "Cybersecurity",
  "Voting Reform",
];

export default function NewIssuePage() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Education");
  const [summary, setSummary] = useState("");
  const [whyItMatters, setWhy] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    const voterKey = ensureAuth("publish this issue");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          summary,
          whyItMatters: whyItMatters || summary,
          pros: pros
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          cons: cons
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          mediaUrl: mediaUrl.trim() || undefined,
          voterKey,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      router.push(portalHref(`/issues/${data.issue.slug}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        Raise an issue
      </p>
      <h1 className="font-display mt-2 text-3xl text-navy">Raise an issue</h1>
      <p className="mt-2 text-sm text-muted">
        Draft freely. Phone OTP login appears when you publish — complete
        anonymity.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-5 border-t border-line pt-8"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title"
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <textarea
          required
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Summary"
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <textarea
          rows={2}
          value={whyItMatters}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="Why it matters"
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <textarea
          rows={3}
          value={pros}
          onChange={(e) => setPros(e.target.value)}
          placeholder="Pros (one per line)"
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <textarea
          rows={3}
          value={cons}
          onChange={(e) => setCons(e.target.value)}
          placeholder="Cons (one per line)"
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <MediaAttach value={mediaUrl} onChange={setMediaUrl} />
        <PostTermsAccept
          accepted={acceptedTerms}
          onAcceptedChange={setAcceptedTerms}
        />
        <button
          type="submit"
          disabled={saving || !acceptedTerms}
          className="bg-amber px-5 py-2.5 text-sm font-semibold text-navy disabled:opacity-60"
        >
          {saving ? "Saving…" : "Publish issue"}
        </button>
      </form>
    </div>
  );
}
