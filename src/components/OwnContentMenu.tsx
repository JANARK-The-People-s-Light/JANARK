"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { ownsByAnonId } from "@/lib/ownership";

type FieldMap = Record<string, string>;

type Props = {
  /** API endpoint e.g. /api/shares/xyz */
  endpoint: string;
  authorAnonId?: string | null;
  /** Prefer server-computed ownership when available */
  isMine?: boolean;
  /** Editable text fields sent on PATCH */
  fields: FieldMap;
  /** Optional labels for fields */
  labels?: Record<string, string>;
  onUpdated?: (payload: unknown) => void;
  onDeleted?: () => void;
  className?: string;
};

/**
 * Edit / Delete controls for the signed-in author of a post.
 */
export function OwnContentMenu({
  endpoint,
  authorAnonId,
  isMine: isMineProp,
  fields,
  labels = {},
  onUpdated,
  onDeleted,
  className = "",
}: Props) {
  const { session, ensureAuth } = useAuth();
  const isMine =
    isMineProp === true ||
    ownsByAnonId(authorAnonId, session?.anonId ?? null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FieldMap>(fields);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isMine) return null;

  async function save() {
    const voterKey = ensureAuth("edit your post");
    if (!voterKey) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, website: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setEditing(false);
      onUpdated?.(data);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "Delete this permanently? Comments on it will be removed too.",
      )
    ) {
      return;
    }
    const voterKey = ensureAuth("delete your post");
    if (!voterKey) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error?: string }).error ?? "Could not delete")
            : "Could not delete",
        );
        return;
      }
      onDeleted?.();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      {!editing ? (
        <div className="flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            onClick={() => {
              setDraft(fields);
              setEditing(true);
              setError(null);
            }}
            className="text-amber hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="text-danger hover:underline disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-line bg-cream/40 p-4">
          {Object.keys(fields).map((key) => (
            <label key={key} className="block">
              <span className="text-xs text-muted">
                {labels[key] ?? key}
              </span>
              <textarea
                rows={key === "title" || key === "ask" ? 2 : 5}
                value={draft[key] ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [key]: e.target.value }))
                }
                className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-amber"
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void save()}
              className="bg-navy px-3 py-1.5 text-sm text-cream disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-sm text-muted hover:text-navy"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
