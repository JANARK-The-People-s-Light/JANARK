"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { MediaAttach } from "@/components/MediaAttach";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

export default function NewMemePage() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    const voterKey = ensureAuth("post this meme");
    if (!voterKey) return;
    setSaving(true);
    try {
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          caption: caption.trim() || null,
          imageUrl: imageUrl.trim(),
          sourceUrl: sourceUrl.trim() || null,
          hashtags,
          voterKey,
          anonymous: true,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not post meme");
        return;
      }
      router.push(portalHref(`/memes/${data.meme.id}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">New meme</p>
      <h1 className="font-display mt-1 text-3xl text-navy">Post media</h1>
      <p className="mt-3 text-sm text-muted">
        Image, GIF, or video via link. Phone OTP on publish — anonymity ID only.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <p className="text-sm text-danger">{error}</p>}
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Title
          </span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
            placeholder="What is this about?"
          />
        </label>
        <MediaAttach
          required
          value={imageUrl}
          onChange={setImageUrl}
          label="Image / GIF / video link"
        />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Caption (optional)
          </span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
            placeholder="Punchline or context"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Hashtags
          </span>
          <input
            required
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
            placeholder="#janark #politics #humour"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Original source link (optional)
          </span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-navy outline-none focus:border-amber"
            placeholder="https://…"
          />
        </label>
        <PostTermsAccept
          accepted={acceptedTerms}
          onAcceptedChange={setAcceptedTerms}
        />
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !acceptedTerms}
            className="bg-navy px-5 py-2.5 text-sm font-medium text-cream disabled:opacity-60"
          >
            {saving ? "Posting…" : "Publish anonymously"}
          </button>
          <Link
            href={portalHref("/memes")}
            className="px-2 py-2.5 text-sm text-muted hover:text-navy"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
