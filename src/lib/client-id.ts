const VOTER_KEY = "janark_voter_key";
const PHONE_SESSION = "janark_phone_session";

export type PhoneSession = {
  voterKey: string;
  hint: string;
  anonId?: string;
  anonymous: boolean;
};

export type SocialPlatform =
  | "facebook"
  | "twitter"
  | "whatsapp"
  | "instagram"
  | "linkedin"
  | "copy"
  | "native";

/** Prefer anonymous phone session; fall back to device key */
export function getVoterKey(): string {
  if (typeof window === "undefined") return "server";
  const phone = getPhoneSession();
  if (phone?.voterKey) return phone.voterKey;

  let key = localStorage.getItem(VOTER_KEY);
  if (!key) {
    key =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VOTER_KEY, key);
  }
  return key;
}

export function getPhoneSession(): PhoneSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PHONE_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as PhoneSession;
  } catch {
    return null;
  }
}

export function savePhoneSession(session: PhoneSession) {
  localStorage.setItem(PHONE_SESSION, JSON.stringify(session));
  localStorage.setItem(VOTER_KEY, session.voterKey);
}

export function clearPhoneSession() {
  localStorage.removeItem(PHONE_SESSION);
  localStorage.removeItem(VOTER_KEY);
}

export function requirePhoneVoterKey(): string | null {
  const s = getPhoneSession();
  return s?.voterKey ?? null;
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
    const voterKey = getPhoneSession()?.voterKey;
    if (!voterKey) return; // share UI may still open; counts need phone OTP
    await fetch("/api/social/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, path, title, voterKey, website: "" }),
    });
  } catch {
    // non-blocking
  }
}
