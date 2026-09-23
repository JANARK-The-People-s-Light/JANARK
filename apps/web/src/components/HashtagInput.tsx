"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  normalizeHashtag,
  parseHashtags,
} from "@/lib/hashtags";

type Suggestion = { tag: string; count: number };

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Required for memes */
  required?: boolean;
  max?: number;
  label?: string;
  hint?: string;
  placeholder?: string;
  className?: string;
};

/**
 * Hashtag field: chips, typeahead, and #tag paste support.
 */
export function HashtagInput({
  value,
  onChange,
  required,
  max = 12,
  label = "Hashtags",
  hint = "Add topics or type #tag in your post — tap suggestions to add.",
  placeholder = "#janark #roads #water",
  className = "",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const addTag = useCallback(
    (raw: string) => {
      const n = normalizeHashtag(raw);
      if (!n) return;
      if (value.includes(n)) {
        setDraft("");
        return;
      }
      if (value.length >= max) return;
      onChange([...value, n]);
      setDraft("");
      setOpen(false);
    },
    [max, onChange, value],
  );

  const addMany = useCallback(
    (raw: string) => {
      const next = parseHashtags([...value, ...raw.split(/[\s,]+/)], max);
      onChange(next);
      setDraft("");
      setOpen(false);
    },
    [max, onChange, value],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [onChange, value],
  );

  useEffect(() => {
    const q = draft.replace(/^#/, "").trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setBusy(true);
      void fetch(`/api/hashtags?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          const list = (data.hashtags ?? []) as Suggestion[];
          setSuggestions(
            list.filter((s) => !value.includes(s.tag)).slice(0, 8),
          );
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [draft, value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " " || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        if (suggestions[0] && e.key === "Enter") addTag(suggestions[0].tag);
        else addMany(draft);
      }
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value[value.length - 1]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative block ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
          {required ? (
            <span className="ml-1 font-normal normal-case text-danger">
              required
            </span>
          ) : (
            <span className="ml-1 font-normal normal-case text-muted">
              optional
            </span>
          )}
        </span>
        <span className="text-[11px] tabular-nums text-muted">
          {value.length}/{max}
        </span>
      </div>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}

      <div className="mt-1.5 flex min-h-11 flex-wrap items-center gap-1.5 border border-line bg-white px-2 py-1.5 focus-within:border-amber">
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => removeTag(tag)}
            className="inline-flex items-center gap-1 rounded-sm bg-sand/80 px-2 py-0.5 text-sm text-navy hover:bg-sand"
            title={`Remove #${tag}`}
          >
            #{tag}
            <span className="text-muted" aria-hidden>
              ×
            </span>
          </button>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text.includes("#") || /[\s,]/.test(text)) {
              e.preventDefault();
              addMany(`${draft} ${text}`);
            }
          }}
          placeholder={value.length === 0 ? placeholder : "Add another…"}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-navy outline-none"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open && suggestions.length > 0}
          autoComplete="off"
          inputMode="text"
        />
      </div>

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto border border-line bg-white py-1 shadow-lg"
        >
          {suggestions.map((s) => (
            <li key={s.tag} role="option">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-navy hover:bg-cream"
                onClick={() => addTag(s.tag)}
              >
                <span className="text-link">#{s.tag}</span>
                {s.count > 0 ? (
                  <span className="text-[11px] tabular-nums text-muted">
                    {s.count}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {busy && draft ? (
        <p className="mt-1 text-[11px] text-muted">Searching topics…</p>
      ) : null}
    </div>
  );
}
