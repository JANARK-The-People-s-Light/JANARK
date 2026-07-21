const PHONE_SESSION = "janark_phone_session";
/** Legacy keys — cleared on read so phone hashes are not left in localStorage */
const LEGACY_VOTER_KEY = "janark_voter_key";

export type PhoneSession = {
  /** @deprecated Never store phoneHash in the browser; cookie holds the session */
  voterKey?: string;
  hint: string;
  anonId?: string;
  anonymous: boolean;
  authenticated?: boolean;
};

export type SocialPlatform =
  | "facebook"
  | "twitter"
  | "whatsapp"
  | "instagram"
  | "linkedin"
  | "copy"
  | "native";

function scrubLegacySecrets() {
  try {
    localStorage.removeItem(LEGACY_VOTER_KEY);
  } catch {
    /* ignore */
  }
}

/** True when the user has a local UI session (cookie must also be valid for writes) */
export function isLoggedInClient(): boolean {
  const s = getPhoneSession();
  return Boolean(s?.authenticated || s?.anonId);
}

/**
 * Sentinel for client forms — real identity is bound server-side from the
 * httpOnly session cookie. Do not treat this as a secret.
 */
export function getVoterKey(): string {
  if (typeof window === "undefined") return "server";
  if (isLoggedInClient()) return "session";
  return "";
}

export function getPhoneSession(): PhoneSession | null {
  if (typeof window === "undefined") return null;
  scrubLegacySecrets();
  try {
    const raw = localStorage.getItem(PHONE_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PhoneSession;
    // Drop any historically stored phoneHash
    if (parsed.voterKey && parsed.voterKey.length >= 32) {
      const cleaned: PhoneSession = {
        hint: parsed.hint,
        anonId: parsed.anonId,
        anonymous: true,
        authenticated: true,
      };
      localStorage.setItem(PHONE_SESSION, JSON.stringify(cleaned));
      return cleaned;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function savePhoneSession(session: PhoneSession) {
  scrubLegacySecrets();
  const safe: PhoneSession = {
    hint: session.hint,
    anonId: session.anonId,
    anonymous: true,
    authenticated: true,
  };
  localStorage.setItem(PHONE_SESSION, JSON.stringify(safe));
}

export async function clearPhoneSession() {
  scrubLegacySecrets();
  localStorage.removeItem(PHONE_SESSION);
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    /* ignore */
  }
}

export function requirePhoneVoterKey(): string | null {
  return isLoggedInClient() ? "session" : null;
}

export function buildShareUrls(opts: {
  url: string;
  title: string;
  text?: string;
}) {
  const encodedUrl = encodeURIComponent(opts.url);
  const encodedText = encodeURIComponent(
    opts.text ?? `${opts.title} — via Janark`,
  );
  const encodedTitle = encodeURIComponent(opts.title);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    instagram: `https://www.instagram.com/`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    mailto: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
  };
}

export async function trackShare(
  platform: SocialPlatform,
  path: string,
  title?: string,
) {
  try {
    if (!isLoggedInClient()) return;
    await fetch("/api/social/share", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, path, title, website: "" }),
    });
  } catch {
    // non-blocking
  }
}
