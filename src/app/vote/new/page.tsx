"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";

export default function NewVotePage() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [voteType, setVoteType] = useState("likert");
  const [issueSlug, setIssueSlug] = useState("");
  const [options, setOptions] = useState("");
  const [locationLevel, setLocationLevel] = useState("national");
  const [town, setTown] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [issues, setIssues] = useState<{ slug: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    fetch("/api/issues", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setIssues(d.issues ?? []))
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    const voterKey = ensureAuth("publish this vote");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          voteType,
          issueSlug: issueSlug || undefined,
          options:
            voteType !== "likert"
              ? options
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
          benefits: ["Citizen mandate", "Public visibility"],
          argumentsFor: ["Open civic participation"],
          argumentsAgainst: ["Needs verification at scale"],
          locationLevel,
          town: town || undefined,
          city: city || undefined,
          district: district || undefined,
          state: state || undefined,
          country,
          voterKey,
          website: "",
          ...termsPayload(acceptedTerms),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      router.push(`/vote/${data.proposal.id}`);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        Create a vote
      </p>
      <h1 className="font-display mt-2 text-3xl text-navy">Start a vote</h1>
      <p className="mt-2 text-sm text-muted">
        Draft freely. Phone OTP login appears when you publish — complete
        anonymity.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-5 border-t border-line pt-8"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Proposal title"
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <select
          value={voteType}
          onChange={(e) => setVoteType(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2"
        >
          <option value="likert">Support scale (Likert)</option>
          <option value="checklist">Multi-select checklist</option>
          <option value="preference">Single preference</option>
        </select>
        {voteType !== "likert" && (
          <textarea
            rows={4}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Options (one per line)"
            className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
        )}
        <select
          value={issueSlug}
          onChange={(e) => setIssueSlug(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2"
        >
          <option value="">No linked issue</option>
          {issues.map((i) => (
            <option key={i.slug} value={i.slug}>
              {i.title}
            </option>
          ))}
        </select>

        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Location scope
        </p>
        <select
          value={locationLevel}
          onChange={(e) => setLocationLevel(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2"
        >
          <option value="national">Nation</option>
          <option value="state">State</option>
          <option value="district">District</option>
          <option value="city">City</option>
          <option value="town">Town</option>
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={town}
            onChange={(e) => setTown(e.target.value)}
            placeholder="Town"
            className="border border-line bg-white px-3 py-2"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="border border-line bg-white px-3 py-2"
          />
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District"
            className="border border-line bg-white px-3 py-2"
          />
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            className="border border-line bg-white px-3 py-2"
          />
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
            className="border border-line bg-white px-3 py-2 sm:col-span-2"
          />
        </div>

        <PostTermsAccept
          accepted={acceptedTerms}
          onAcceptedChange={setAcceptedTerms}
        />

        <button
          type="submit"
          disabled={saving || !acceptedTerms}
          className="bg-amber px-5 py-2.5 text-sm font-semibold text-navy disabled:opacity-60"
        >
          {saving ? "Creating…" : "Publish vote"}
        </button>
      </form>
    </div>
  );
}
