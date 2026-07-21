"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getVoterKey } from "@/lib/client-id";
import { MemeCard, type MemeCardData } from "@/components/MemeCard";

export default function MemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [meme, setMeme] = useState<MemeCardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(
      `/api/memes/${id}?voterKey=${encodeURIComponent(getVoterKey())}`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not found");
      return;
    }
    setMeme(data.meme);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-muted">{error}</p>
        <Link href="/memes" className="mt-4 inline-block text-amber">
          Back to memes
        </Link>
      </div>
    );
  }

  if (!meme) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/memes"
        className="text-sm text-muted hover:text-amber"
      >
        ← All memes
      </Link>
      <div className="mt-6">
        <MemeCard
          meme={meme}
          onTagClick={(t) => router.push(`/memes?tag=${encodeURIComponent(t)}`)}
        />
      </div>
      {meme.sourceUrl && (
        <p className="mt-4 text-sm text-muted">
          Source:{" "}
          <a
            href={meme.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:underline"
          >
            original link
          </a>
        </p>
      )}
    </div>
  );
}
