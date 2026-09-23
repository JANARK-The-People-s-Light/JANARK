"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthModal";
import {
  CivicCreateShell,
  createBodyClass,
  createQuietInputClass,
} from "@/components/CivicCreateShell";
import { MediaAttach } from "@/components/MediaAttach";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

export function CreateMemeComposer() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("#janark");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();

  async function onPublish(e: FormEvent) {
    e.preventDefault();
    const voterKey = ensureAuth("post a meme");
    if (!voterKey) return;
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms to publish.");
      return;
    }
    if (!title.trim() || !imageUrl.trim()) {
      setError("Title and media are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/memes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          caption: caption.trim() || undefined,
          imageUrl: imageUrl.trim(),
          tags: tags
            .split(/[\s,]+/)
            .map((t) => t.replace(/^#/, "").trim())
            .filter(Boolean),
          voterKey,
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not post meme");
      const id = data.meme?.id as string | undefined;
      router.push(id ? portalHref(`/memes/${id}`) : portalHref("/memes"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post meme");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CivicCreateShell
      intent="Post a meme"
      support="Civic humor with a point — add at least one hashtag."
      backHref={portalHref("/memes")}
      backLabel="Memes"
      error={error}
      onSubmit={onPublish}
      hasPreviewContent={title.trim().length > 2}
      preview={
        title.trim() ? (
          <p className="font-display text-xl text-navy">{title.trim()}</p>
        ) : null
      }
      acceptedTerms={acceptedTerms}
      onAcceptedChange={setAcceptedTerms}
      termsId="meme-terms"
      draftNote={null}
      onSaveDraft={() => {}}
      publishLabel="Publish meme"
      publishing={saving}
      canPublish={
        acceptedTerms && Boolean(title.trim() && imageUrl.trim())
      }
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className={createQuietInputClass}
        maxLength={120}
      />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        rows={3}
        className={createBodyClass}
      />
      <MediaAttach value={imageUrl} onChange={setImageUrl} label="Meme media" required />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Hashtags (#janark #roads)"
        className={createQuietInputClass}
      />
    </CivicCreateShell>
  );
}
