import { hashPhone, normalizePhone, phoneHint } from "@/lib/phone";

/** First + last name required (at least two words, letters). */
export function parsePetitionFullName(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (cleaned.length < 3 || cleaned.length > 120) return null;
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length < 2) return null;
  if (!parts.every((p) => /^[\p{L}\p{M}'.-]+$/u.test(p))) return null;
  return parts.map((p) => p[0]!.toUpperCase() + p.slice(1)).join(" ");
}

/**
 * ZIP / postal / Indian PIN — letters/digits, 3–12 chars after stripping spaces.
 */
export function parsePostalCode(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, "").trim().toUpperCase();
  if (cleaned.length < 3 || cleaned.length > 12) return null;
  if (!/^[A-Z0-9-]+$/.test(cleaned)) return null;
  return cleaned;
}

export function parsePetitionPhone(raw: string): {
  normalized: string;
  phoneHash: string;
  phoneHint: string;
} | null {
  const normalized = normalizePhone(raw);
  if (!normalized) return null;
  return {
    normalized,
    phoneHash: hashPhone(normalized),
    phoneHint: phoneHint(normalized),
  };
}

export type PetitionSignInput = {
  fullName: string;
  postalCode: string;
  phone: string;
};

export function validatePetitionSign(input: PetitionSignInput):
  | { ok: true; fullName: string; postalCode: string; phoneHash: string; phoneHint: string }
  | { ok: false; error: string } {
  const fullName = parsePetitionFullName(input.fullName);
  if (!fullName) {
    return {
      ok: false,
      error: "Enter your full name (first and last name)",
    };
  }
  const postalCode = parsePostalCode(input.postalCode);
  if (!postalCode) {
    return {
      ok: false,
      error: "Enter a valid ZIP / postal / PIN code",
    };
  }
  const phone = parsePetitionPhone(input.phone);
  if (!phone) {
    return {
      ok: false,
      error: "Enter a valid phone number",
    };
  }
  return {
    ok: true,
    fullName,
    postalCode,
    phoneHash: phone.phoneHash,
    phoneHint: phone.phoneHint,
  };
}
