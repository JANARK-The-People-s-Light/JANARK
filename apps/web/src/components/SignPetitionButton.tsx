"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useAuth } from "@/components/AuthModal";

type Props = {
  demandId: string;
  initialCount?: number;
  compact?: boolean;
  className?: string;
  onSigned?: (supportCount: number) => void;
};

/**
 * Sign a live petition — full name, ZIP/postal, and verified phone
 * for geographic relevance.
 */
export function SignPetitionButton({
  demandId,
  initialCount = 0,
  compact,
  className = "",
  onSigned,
}: Props) {
  const { ensureAuth, session } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [signed, setSigned] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/demands/${demandId}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!res.ok) return;
    setCount(data.demand?.supportCount ?? initialCount);
    setSigned(Boolean(data.supportedByMe));
  }, [demandId, initialCount]);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    void load();
  }, [load]);

  function startSign(e?: MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setError(null);
    const voterKey = ensureAuth("sign this petition");
    if (!voterKey) return;
    setOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    const voterKey = ensureAuth("sign this petition");
    if (!voterKey) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/demands/${demandId}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: "",
          fullName,
          postalCode,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not sign");
        return;
      }
      setSigned(true);
      setOpen(false);
      const next =
        data.demand?.supportCount ?? count + (data.alreadySupported ? 0 : 1);
      setCount(next);
      onSigned?.(next);
    } finally {
      setBusy(false);
    }
  }

  const form = open && !signed && (
    <form
      onSubmit={submit}
      className="mt-3 space-y-3 border border-line bg-cream/40 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs text-muted">
        To prove geographic relevance, petitions need your full name, ZIP /
        postal code, and the phone number you verified with OTP
        {session?.hint ? ` (${session.hint})` : ""}.
      </p>
      <label className="block text-xs font-medium text-navy">
        Full name (first and last)
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          autoComplete="name"
          className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber"
        />
      </label>
      <label className="block text-xs font-medium text-navy">
        ZIP / Postal / PIN code
        <input
          required
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="e.g. 110001"
          autoComplete="postal-code"
          className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber"
        />
      </label>
      <label className="block text-xs font-medium text-navy">
        Phone number
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit mobile"
          autoComplete="tel"
          className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-amber"
        />
      </label>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-amber px-4 py-2.5 text-sm font-semibold text-on-amber hover:bg-amber-bright disabled:opacity-60"
        >
          {busy ? "Signing…" : "Confirm signature"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
          className="px-3 py-2.5 text-sm text-muted hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  if (compact) {
    return (
      <div className={className} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          disabled={busy || signed}
          onClick={startSign}
          className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition ${
            signed
              ? "border-line bg-sand/50 text-navy/70"
              : "border-amber bg-amber text-on-amber hover:bg-amber-bright"
          }`}
        >
          {signed ? "Signed" : "Sign the petition"}
          <span className="tabular-nums font-normal opacity-80">
            · {count.toLocaleString("en-IN")}
          </span>
        </button>
        {form}
        {!open && error ? (
          <p className="mt-1 text-xs text-danger">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || signed}
          onClick={startSign}
          className={`min-h-11 px-5 py-2.5 text-sm font-semibold transition ${
            signed
              ? "border border-line bg-sand/40 text-navy/70"
              : "bg-amber text-on-amber hover:bg-amber-bright"
          }`}
        >
          {signed ? "You signed this petition" : "Sign the petition"}
        </button>
        <p className="text-sm text-muted">
          <span className="font-semibold tabular-nums text-navy">
            {count.toLocaleString("en-IN")}
          </span>{" "}
          {count === 1 ? "signature" : "signatures"}
        </p>
      </div>
      {form}
      {!open && error ? (
        <p className="mt-2 text-xs text-danger">{error}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        Non-binding · full name, ZIP, and verified phone required for geographic
        relevance · phone never shown publicly
      </p>
    </div>
  );
}
