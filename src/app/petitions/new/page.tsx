"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthModal";
import { MediaAttach } from "@/components/MediaAttach";
import { PostTermsAccept } from "@/components/PostTermsAccept";
import { useCivicPostTermsAccept } from "@/components/useCivicPostTermsAccept";
import { termsPayload } from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

export default function NewPetitionPage() {
  const router = useRouter();
  const { ensureAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ask, setAsk] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [target, setTarget] = useState("government");
  const [targetDetail, setTargetDetail] = useState("");
  const [category, setCategory] = useState("");
  const [locationLevel, setLevel] = useState("city");
  const [town, setTown] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useCivicPostTermsAccept();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Accept the Civic Posting Terms & Conditions to publish.");
      return;
    }
    if (!mediaUrl.trim()) {
      setError("Add an attachment (image, GIF, or video) before publishing.");
      return;
    }
    const voterKey = ensureAuth("start this petition");
    if (!voterKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          ask,
          mediaUrl: mediaUrl.trim(),
          target,
          targetDetail: targetDetail || undefined,
          category: category || undefined,
          locationLevel,
          town: town || undefined,
          city: city || undefined,
          district: district || undefined,
          state: state || undefined,
          country,
          anonymous: true,
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
      router.push(portalHref(`/petitions/${data.demand.id}`));
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">Petition</p>
      <h1 className="font-display mt-2 text-3xl text-navy">Start a petition</h1>
      <p className="mt-3 text-sm text-muted">
        Draft freely. Login with phone OTP appears when you publish. Signatures
        later require full name, ZIP, and verified phone.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-5 border-t border-line pt-8"
      >
        {error && <p className="text-sm text-danger">{error}</p>}

        <label className="block text-sm">
          <span className="text-xs uppercase tracking-wider text-muted">
            Title <span className="text-danger">*</span>
          </span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fix street lighting on Ring Road"
            className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs uppercase tracking-wider text-muted">
            Clear ask <span className="text-danger">*</span>
          </span>
          <input
            required
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="One sentence: what should change?"
            className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs uppercase tracking-wider text-muted">
            Why this matters <span className="text-danger">*</span>
          </span>
          <textarea
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Background, impact on people, and any evidence summary"
            className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
        </label>

        <MediaAttach
          value={mediaUrl}
          onChange={setMediaUrl}
          required
          label="Evidence attachment"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-muted">
              Who should act <span className="text-danger">*</span>
            </span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full border border-line bg-white px-3 py-2"
            >
              <option value="government">Government</option>
              <option value="state">State</option>
              <option value="district">District</option>
              <option value="institution">Institution</option>
              <option value="public">Public / civic body</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-muted">
              Office / ministry (optional)
            </span>
            <input
              value={targetDetail}
              onChange={(e) => setTargetDetail(e.target.value)}
              placeholder="e.g. Municipal corporation, MoHFW"
              className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-xs uppercase tracking-wider text-muted">
            Location level <span className="text-danger">*</span>
          </span>
          <select
            value={locationLevel}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 w-full border border-line bg-white px-3 py-2"
          >
            <option value="village">Village</option>
            <option value="town">Town</option>
            <option value="city">City</option>
            <option value="district">District</option>
            <option value="state">State</option>
            <option value="national">Nation</option>
            <option value="country">Country</option>
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-muted">
              Village / town
            </span>
            <input
              value={town}
              onChange={(e) => setTown(e.target.value)}
              placeholder="If applicable"
              className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-muted">
              City
            </span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City name"
              className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-muted">
              District
            </span>
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="District name"
              className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs uppercase tracking-wider text-muted">
              State
            </span>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State / UT"
              className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-xs uppercase tracking-wider text-muted">
              Country
            </span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-xs uppercase tracking-wider text-muted">
            Category (optional)
          </span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. education, health, infrastructure"
            className="mt-1 w-full border border-line bg-white px-3 py-2 outline-none focus:border-amber"
          />
        </label>

        <PostTermsAccept
          accepted={acceptedTerms}
          onAcceptedChange={setAcceptedTerms}
        />
        <button
          type="submit"
          disabled={saving || !acceptedTerms || !mediaUrl.trim()}
          className="bg-amber px-5 py-2.5 text-sm font-semibold text-navy disabled:opacity-60"
        >
          {saving ? "Publishing…" : "Publish petition"}
        </button>
      </form>
    </div>
  );
}
