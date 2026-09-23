"use client";

import { useEffect, useState } from "react";
import type { Proposal } from "@/lib/types";
import { getPhoneSession } from "@/lib/client-id";
import { DemoBadge, NonBindingLabel } from "@/components/Ui";
import { SocialShare } from "@/components/SocialShare";
import { useAuth } from "@/components/AuthModal";

const LIKERT = [
  { value: "strongly_support", label: "Strongly Support" },
  { value: "support", label: "Support" },
  { value: "neutral", label: "Neutral" },
  { value: "oppose", label: "Oppose" },
  { value: "strongly_oppose", label: "Strongly Oppose" },
] as const;

export function VoteForm({ proposal }: { proposal: Proposal }) {
  const { ensureAuth, session, refreshSession } = useAuth();
  const [choice, setChoice] = useState<string>("");
  const [checks, setChecks] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [prior, setPrior] = useState<string | string[] | null>(null);
  const [liveVotes, setLiveVotes] = useState<number | null>(null);
  const [liveResults, setLiveResults] = useState<Record<string, number> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const phoneReady = !!session || !!getPhoneSession();

  useEffect(() => {
    refreshSession();
    fetch(`/api/votes/me?proposalId=${encodeURIComponent(proposal.id)}`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.vote?.choice != null) {
          const c = data.vote.choice;
          setPrior(c);
          setSubmitted(true);
          if (Array.isArray(c)) setChecks(c);
          else setChoice(String(c));
        }
      })
      .catch(() => {});

    fetch(`/api/votes/${proposal.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.liveVotes === "number") setLiveVotes(data.liveVotes);
        if (data.results) setLiveResults(data.results);
      })
      .catch(() => {});
  }, [proposal.id, refreshSession]);

  function toggleCheck(opt: string) {
    setChecks((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const voterKey = ensureAuth("cast your vote");
    if (!voterKey) return;
    const payload = proposal.voteType === "checklist" ? checks : choice;
    if (
      (proposal.voteType === "checklist" && checks.length === 0) ||
      (proposal.voteType !== "checklist" && !choice)
    ) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/votes/${proposal.id}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: payload, website: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save vote");
        return;
      }
      setSubmitted(true);
      setPrior(payload);
      if (typeof data.liveVotes === "number") setLiveVotes(data.liveVotes);
      if (data.results) setLiveResults(data.results);
    } catch {
      setError("Network error — is the database running?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg text-navy sm:text-xl">Cast your vote</h2>
          <DemoBadge />
        </div>
        <NonBindingLabel className="mb-5" />
        {liveVotes != null && (
          <p className="mb-4 text-xs text-muted">
            {liveVotes.toLocaleString("en-IN")} anonymous phone-verified votes
          </p>
        )}

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        {!phoneReady && (
          <p className="mb-3 text-sm text-muted">
            Browse freely — when you submit, we&apos;ll ask for a phone OTP and
            keep you fully anonymous.
          </p>
        )}

        {submitted && prior != null ? (
          <div className="space-y-3">
            <p className="text-sm text-success">Your anonymous vote is saved.</p>
            <p className="text-sm text-muted">
              You selected:{" "}
              <span className="font-medium text-navy">
                {Array.isArray(prior) ? prior.join(", ") : formatLabel(prior)}
              </span>
            </p>
            <button
              type="button"
              className="text-sm text-link underline-offset-2 hover:underline"
              onClick={() => setSubmitted(false)}
            >
              Change vote
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {proposal.voteType === "likert" && (
              <fieldset className="space-y-2">
                <legend className="sr-only">Support level</legend>
                {LIKERT.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex min-h-11 cursor-pointer items-center gap-3 border border-transparent px-2 py-2.5 hover:border-line hover:bg-sand/50"
                  >
                    <input
                      type="radio"
                      name="likert"
                      value={opt.value}
                      checked={choice === opt.value}
                      onChange={() => setChoice(opt.value)}
                      className="accent-amber"
                    />
                    <span className="text-sm text-navy">{opt.label}</span>
                  </label>
                ))}
              </fieldset>
            )}

            {proposal.voteType === "checklist" && proposal.options && (
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium text-navy">
                  Should candidates have:
                </legend>
                {proposal.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 px-2 py-2 hover:bg-sand/50"
                  >
                    <input
                      type="checkbox"
                      checked={checks.includes(opt)}
                      onChange={() => toggleCheck(opt)}
                      className="accent-amber"
                    />
                    <span className="text-sm text-navy">{opt}</span>
                  </label>
                ))}
              </fieldset>
            )}

            {proposal.voteType === "preference" && proposal.options && (
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium text-navy">
                  Preferred background
                </legend>
                {proposal.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 px-2 py-2 hover:bg-sand/50"
                  >
                    <input
                      type="radio"
                      name="pref"
                      value={opt}
                      checked={choice === opt}
                      onChange={() => setChoice(opt)}
                      className="accent-amber"
                    />
                    <span className="text-sm text-navy">{opt}</span>
                  </label>
                ))}
              </fieldset>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-chrome px-5 py-2.5 text-sm font-medium text-on-chrome transition hover:bg-chrome-mid disabled:opacity-60"
            >
              {saving ? "Saving…" : "Submit anonymous vote"}
            </button>
          </form>
        )}

        {liveResults && liveVotes != null && liveVotes > 0 && (
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
              Live results
            </h3>
            <ul className="space-y-3">
              {Object.entries(liveResults)
                .sort((a, b) => b[1] - a[1])
                .map(([key, pct], i) => (
                  <li key={key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-navy">{formatLabel(key)}</span>
                      <span className="text-muted">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden bg-sand">
                      <div
                        className="bar-fill h-full bg-amber"
                        style={{
                          width: `${pct}%`,
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              From {liveVotes.toLocaleString("en-IN")} anonymous phone-verified
              votes
            </p>
          </div>
        )}
      </div>

      <SocialShare
        path={`/vote/${proposal.id}`}
        title={proposal.title}
        text={`I voted on "${proposal.title}" on Janark — every voice illuminates India.`}
      />
    </div>
  );
}

function formatLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
