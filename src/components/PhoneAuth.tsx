"use client";

import { useEffect, useState } from "react";
import {
  clearPhoneSession,
  getPhoneSession,
  getVoterKey,
  savePhoneSession,
  type PhoneSession,
} from "@/lib/client-id";

type Props = {
  onVerified?: (session: PhoneSession) => void;
};

/**
 * Log in with phone number + OTP.
 * Proves one real person; we store a one-way hash — number never shown.
 */
export function PhoneAuth({ onVerified }: Props) {
  const [session, setSession] = useState<PhoneSession | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "otp">("idle");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState("");

  useEffect(() => {
    setSession(getPhoneSession());
  }, []);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/phone/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, website: hp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send OTP");
        return;
      }
      setHint(data.hint);
      setDevCode(data.devCode ?? null);
      setStep("otp");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, website: hp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      savePhoneSession(data.session);
      setSession(data.session);
      onVerified?.(data.session);
      setStep("idle");
      setCode("");
      setDevCode(null);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-navy">
          Logged in ·{" "}
          <strong>
            {session.anonId ? `Anon ${session.anonId}` : "anonymous"}
          </strong>
          {session.hint ? ` (${session.hint})` : ""}
        </p>
        <p className="text-xs text-muted">
          Your anonymity ID is public; your phone number is never shown.
        </p>
        <button
          type="button"
          className="text-xs text-amber underline"
          onClick={() => {
            clearPhoneSession();
            setSession(null);
          }}
        >
          Log out
        </button>
        <span className="sr-only">{getVoterKey()}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Phone OTP
      </p>
      <p className="mt-1 text-sm text-muted">
        Enter your mobile for a one-time code.
      </p>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <input
        tabIndex={-1}
        autoComplete="off"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden
        name="website"
      />

      {step === "idle" ? (
        <form onSubmit={requestOtp} className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            required
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full min-w-0 flex-1 border border-line bg-white px-3 py-3 text-base outline-none focus:border-amber sm:min-w-[180px] sm:py-2 sm:text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-navy px-4 py-3 text-sm text-cream disabled:opacity-60 sm:w-auto sm:py-2"
          >
            {busy ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-3 space-y-2">
          <p className="text-xs text-muted">OTP sent to number ending {hint}</p>
          {devCode && (
            <p className="text-xs text-amber">
              Dev OTP: <strong>{devCode}</strong>
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit OTP"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-line bg-white px-3 py-3 text-base outline-none focus:border-amber sm:w-36 sm:py-2 sm:text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-amber px-4 py-3 text-sm font-semibold text-navy disabled:opacity-60 sm:w-auto sm:py-2"
            >
              {busy ? "Verifying…" : "Log in"}
            </button>
            <button
              type="button"
              className="py-2 text-xs text-muted underline"
              onClick={() => setStep("idle")}
            >
              Change number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
