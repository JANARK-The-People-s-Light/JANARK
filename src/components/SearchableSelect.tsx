"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IconDown, IconSearch, IconX } from "@/components/Icons";

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  /** Shown when value is empty */
  emptyLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  /** Force search even for short lists (default: auto when ≥ 6 options) */
  searchable?: boolean;
  /** quiet = underline (composers); box = bordered (filters) */
  variant?: "quiet" | "box";
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

function matches(opt: SearchableOption, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${opt.label} ${opt.keywords ?? ""} ${opt.value}`.toLowerCase();
  return hay.includes(needle);
}

/**
 * Select that opens a find-as-you-type list when there are enough options.
 * Short lists still get a search field when `searchable` is true.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  emptyLabel = "None",
  placeholder = "Choose…",
  searchPlaceholder = "Search…",
  className = "",
  searchable,
  variant = "quiet",
  disabled,
  id,
  "aria-label": ariaLabel,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const showSearch = searchable ?? options.length >= 6;
  const triggerClass =
    variant === "box"
      ? "flex min-h-11 w-full items-center justify-between gap-2 border border-line bg-white px-3 py-2 text-left text-sm text-navy outline-none transition focus:border-amber disabled:opacity-50"
      : "flex min-h-11 w-full items-center justify-between gap-2 border-0 border-b border-line bg-transparent py-2.5 text-left text-[15px] text-navy outline-none transition focus:border-amber disabled:opacity-50";

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(
    () => options.filter((o) => matches(o, query)),
    [options, query],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={triggerClass}
      >
        <span className={selected || value === "" ? "text-navy" : "text-muted"}>
          {selected?.label ?? (value === "" ? emptyLabel : placeholder)}
        </span>
        <IconDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-hidden border border-line bg-white shadow-xl"
        >
          {showSearch ? (
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <IconSearch className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-muted"
                aria-label={searchPlaceholder}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted hover:text-navy"
                  aria-label="Clear search"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}

          <ul className="max-h-52 overflow-y-auto py-1">
            <li role="option" aria-selected={value === ""}>
              <button
                type="button"
                onClick={() => pick("")}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-cream ${
                  value === "" ? "bg-sand/40 font-medium text-navy" : "text-navy"
                }`}
              >
                {emptyLabel}
              </button>
            </li>
            {filtered.map((o) => (
              <li key={o.value} role="option" aria-selected={value === o.value}>
                <button
                  type="button"
                  onClick={() => pick(o.value)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-cream ${
                    value === o.value
                      ? "bg-sand/40 font-medium text-navy"
                      : "text-navy"
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted">No matches</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
