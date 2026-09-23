"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Local draft autosave for civic create composers.
 */
export function useCreateDraft<T extends object>(key: string, empty: T) {
  const [draft, setDraft] = useState<T>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        setDraft({ ...empty, ...parsed });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- empty is stable module const
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(draft));
        setDraftNote("Draft saved");
      } catch {
        /* ignore quota */
      }
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, hydrated, key]);

  useEffect(() => {
    if (!draftNote) return;
    const t = window.setTimeout(() => setDraftNote(null), 1800);
    return () => window.clearTimeout(t);
  }, [draftNote]);

  const patch = useCallback((partial: Partial<T>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const saveDraftNow = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(draft));
      setDraftNote("Draft saved");
    } catch {
      setDraftNote(null);
    }
  }, [draft, key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key]);

  return {
    draft,
    setDraft,
    patch,
    hydrated,
    draftNote,
    saveDraftNow,
    clearDraft,
  };
}
