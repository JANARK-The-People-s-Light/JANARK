"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { MediaAttach } from "@/components/MediaAttach";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

export default function NewReportPage() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [type, setType] = useState("problem");
  const [locationLevel, setLevel] = useState("village");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [village, setVillage] = useState("");
  const [town, setTown] = useState("");
  const [city, setCity] = useState("");
  const [block, setBlock] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [anonymous, setAnonymous] = useState(true);
  const [authorLabel, setAuthorLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    const voterKey = ensureAuth("post this report");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          locationLevel,
          title,
          body,
          mediaUrl: mediaUrl.trim() || undefined,
          village: village || undefined,
          town: town || undefined,
          city: city || undefined,
          block: block || undefined,
          district: district || undefined,
          state: state || undefined,
          country,
          anonymous,
          authorLabel: anonymous ? undefined : authorLabel,
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
      router.push(portalHref(`/reports/${data.report.id}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">
        Report · village to country
      </p>
      <h1 className="font-display mt-2 text-3xl text-navy">
        Post an issue, crime, or problem
      </h1>
      <p className="mt-3 text-sm text-muted">
        Draft freely. Phone OTP login appears when you publish — we keep
        complete anonymity.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-5 border-t border-line pt-8"
      >
        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-muted">
              Type
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full border border-line bg-white px-3 py-2"
            >
              <option value="issue">Issue</option>
              <option value="crime">Crime</option>
              <option value="problem">Problem</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-muted">
              Location level
            </span>
            <select
              value={locationLevel}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-1 w-full border border-line bg-white px-3 py-2"
            >
              <option value="village">Village</option>
              <option value="town">Town</option>
              <option value="city">City</option>
              <option value="block">Block / Taluk</option>
              <option value="district">District</option>
              <option value="state">State</option>
              <option value="national">Nation</option>
              <option value="country">Country</option>
            </select>
          </label>
        </div>

        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What happened / what needs attention?"
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <textarea
          required
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe the problem. Avoid posting others' private details."
          className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
        />
        <MediaAttach value={mediaUrl} onChange={setMediaUrl} />

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Village / locality"
            className="border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
          <input
            value={town}
            onChange={(e) => setTown(e.target.value)}
            placeholder="Town"
            className="border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
          <input
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            placeholder="Block / taluk"
            className="border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District"
            className="border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            className="border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country / nation"
            className="border border-line bg-white px-3 py-2 outline-none focus:border-amber sm:col-span-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="accent-amber"
          />
          Post as Anonymous citizen
        </label>
        {!anonymous && (
          <input
            value={authorLabel}
            onChange={(e) => setAuthorLabel(e.target.value)}
            placeholder="Display name (not your phone)"
            className="w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
        )}

        <PostTermsAccept
          accepted={acceptedTerms}
          onAcceptedChange={setAcceptedTerms}
        />

        <button
          type="submit"
          disabled={saving || !acceptedTerms}
          className="bg-amber px-5 py-2.5 text-sm font-semibold text-navy disabled:opacity-60"
        >
          {saving ? "Publishing…" : "Publish report"}
        </button>
      </form>
    </div>
  );
}
