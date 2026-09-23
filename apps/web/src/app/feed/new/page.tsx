"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { HashtagInput } from "@/components/HashtagInput";
import { MediaAttach } from "@/components/MediaAttach";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

export default function NewDiscussionPage() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("opinion");
  const [mediaUrl, setMediaUrl] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    const voterKey = ensureAuth("start a discussion");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
          hashtags,
          author: "Anonymous citizen",
          kind,
          voterKey,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to post");
        return;
      }
      const href =
        typeof data.discussion?.href === "string"
          ? data.discussion.href
          : data.discussion?.publicId
            ? `/p/${data.discussion.publicId}`
            : "/feed";
      router.push(portalHref(href));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        Open square
      </p>
      <h1 className="font-display mt-2 text-3xl text-navy">
        Start a discussion
      </h1>
      <p className="mt-3 text-sm text-muted">
        Draft freely. Phone OTP login appears when you publish — anonymity ID
        only.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-5 border-t border-line pt-8"
      >
        {error && <p className="text-sm text-danger">{error}</p>}

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Topic
          </span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What should people talk about?"
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Kind
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-navy"
          >
            <option value="opinion">Opinion</option>
            <option value="evidence">Evidence</option>
            <option value="news">News</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Your thoughts
          </span>
          <textarea
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share a fact, news, or opinion…"
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
          />
        </label>

        <MediaAttach value={mediaUrl} onChange={setMediaUrl} />
        <HashtagInput value={hashtags} onChange={setHashtags} />
        <PostTermsAccept
          accepted={acceptedTerms}
          onAcceptedChange={setAcceptedTerms}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !acceptedTerms}
            className="bg-amber px-5 py-2.5 text-sm font-semibold text-on-amber disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish anonymously"}
          </button>
          <Link
            href={portalHref("/feed")}
            className="px-2 py-2.5 text-sm text-muted hover:text-navy"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
