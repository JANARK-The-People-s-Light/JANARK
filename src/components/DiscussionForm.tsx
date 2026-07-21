"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthModal";
import { MediaAttach } from "@/components/MediaAttach";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";

export function DiscussionForm({ issueSlug }: { issueSlug: string }) {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [kind, setKind] = useState("opinion");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && !mediaUrl.trim()) return;
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    const voterKey = ensureAuth("post a comment");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueSlug,
          body: body.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          author: "Anonymous citizen",
          kind,
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
      setBody("");
      setMediaUrl("");
      setAcceptedTerms(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 border-t border-line pt-6"
    >
      {error && <p className="text-sm text-danger">{error}</p>}
      <textarea
        required={!mediaUrl.trim()}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add your voice… (login pops up only when you post)"
        className="w-full border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-amber"
      />
      <MediaAttach value={mediaUrl} onChange={setMediaUrl} />
      <PostTermsAccept
        accepted={acceptedTerms}
        onAcceptedChange={setAcceptedTerms}
        compact
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="border border-line bg-white px-2 py-2 text-sm"
        >
          <option value="opinion">Opinion</option>
          <option value="evidence">Evidence</option>
          <option value="news">News</option>
        </select>
        <button
          type="submit"
          disabled={saving || !acceptedTerms}
          className="bg-navy px-4 py-2 text-sm text-cream disabled:opacity-60"
        >
          {saving ? "Posting…" : "Post anonymously"}
        </button>
      </div>
    </form>
  );
}
