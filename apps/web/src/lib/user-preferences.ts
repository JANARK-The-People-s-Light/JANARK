/**
 * User settings preferences (Settings page).
 * Server-backed per logged-in citizen (PhoneSettings); local cache keyed by anonId.
 */

import {
  DEFAULT_THEME_ID,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

export const PREFS_STORAGE_KEY = "janark-prefs-v1";

export type FeedSortPref = "trending" | "new" | "hot" | "momentum";

export type FontScalePref = "sm" | "md" | "lg";
/** App UI language preference. Only English ships today; others are reserved. */
export type LanguagePref =
  | "en"
  | "hi"
  | "bn"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as";

export const LANGUAGE_OPTIONS: { value: LanguagePref; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (coming)" },
  { value: "bn", label: "বাংলা (coming)" },
  { value: "ta", label: "தமிழ் (coming)" },
  { value: "te", label: "తెలుగు (coming)" },
  { value: "mr", label: "मराठी (coming)" },
  { value: "gu", label: "ગુજરાતી (coming)" },
  { value: "kn", label: "ಕನ್ನಡ (coming)" },
  { value: "ml", label: "മലയാളം (coming)" },
  { value: "pa", label: "ਪੰਜਾਬੀ (coming)" },
  { value: "or", label: "ଓଡ଼ିଆ (coming)" },
  { value: "as", label: "অসমীয়া (coming)" },
];

export type UserPreferences = {
  /** Home feed default sort */
  feedSort: FeedSortPref;
  /** Prefer chronological Activity when available */
  activityChronological: boolean;
  /** Soften graphic report media by default */
  blurSensitiveMedia: boolean;
  /** Show community shares in home “all” */
  showSharesInFeed: boolean;
  /** Email/SMS style digests — device intent until backend */
  notifyReplies: boolean;
  notifyFollows: boolean;
  notifyMentions: boolean;
  notifyWeeklyDigest: boolean;
  /** Accessibility */
  reduceMotion: boolean;
  fontScale: FontScalePref;
  /** Privacy signals (device intent) */
  showOnlineHint: boolean;
  allowProfileDiscovery: boolean;
  /** Language UI label (content stays as posted) */
  language: LanguagePref;
};

/** Full settings blob stored per user (prefs + theme). */
export type UserSettingsBlob = {
  preferences: UserPreferences;
  themeId: ThemeId;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  feedSort: "trending",
  activityChronological: false,
  blurSensitiveMedia: true,
  showSharesInFeed: true,
  notifyReplies: true,
  notifyFollows: true,
  notifyMentions: true,
  notifyWeeklyDigest: false,
  reduceMotion: false,
  fontScale: "md",
  showOnlineHint: false,
  allowProfileDiscovery: true,
  language: "en",
};

export const DEFAULT_SETTINGS: UserSettingsBlob = {
  preferences: { ...DEFAULT_PREFERENCES },
  themeId: DEFAULT_THEME_ID,
};

export function normalizePreferences(
  partial?: Partial<UserPreferences> | null,
): UserPreferences {
  const next = { ...DEFAULT_PREFERENCES, ...(partial ?? {}) };
  if (!LANGUAGE_OPTIONS.some((o) => o.value === next.language)) {
    next.language = DEFAULT_PREFERENCES.language;
  }
  const sorts: FeedSortPref[] = ["trending", "new", "hot", "momentum"];
  if (!sorts.includes(next.feedSort)) next.feedSort = "trending";
  const scales: FontScalePref[] = ["sm", "md", "lg"];
  if (!scales.includes(next.fontScale)) next.fontScale = "md";

  const boolKeys: (keyof UserPreferences)[] = [
    "activityChronological",
    "blurSensitiveMedia",
    "showSharesInFeed",
    "notifyReplies",
    "notifyFollows",
    "notifyMentions",
    "notifyWeeklyDigest",
    "reduceMotion",
    "showOnlineHint",
    "allowProfileDiscovery",
  ];
  for (const key of boolKeys) {
    const v = partial?.[key];
    (next as UserPreferences)[key] = (
      typeof v === "boolean" ? v : DEFAULT_PREFERENCES[key]
    ) as never;
  }
  return next;
}

export function normalizeSettingsBlob(
  raw?: {
    preferences?: Partial<UserPreferences> | null;
    themeId?: string | null;
  } | null,
): UserSettingsBlob {
  const themeId = isThemeId(raw?.themeId) ? raw!.themeId : DEFAULT_THEME_ID;
  return {
    preferences: normalizePreferences(raw?.preferences ?? undefined),
    themeId,
  };
}

export function parseSettingsJson(json: string | null | undefined): UserSettingsBlob {
  if (!json) return { ...DEFAULT_SETTINGS, preferences: { ...DEFAULT_PREFERENCES } };
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (parsed && typeof parsed === "object" && "preferences" in parsed) {
      return normalizeSettingsBlob({
        preferences: parsed.preferences as Partial<UserPreferences>,
        themeId: parsed.themeId as string | undefined,
      });
    }
    return normalizeSettingsBlob({
      preferences: parsed as Partial<UserPreferences>,
      themeId: parsed.themeId as string | undefined,
    });
  } catch {
    return { ...DEFAULT_SETTINGS, preferences: { ...DEFAULT_PREFERENCES } };
  }
}

function cacheKey(anonId: string) {
  return `${PREFS_STORAGE_KEY}:${anonId}`;
}

/** Cache settings for a logged-in anonId (device speed only). */
export function readCachedSettings(anonId: string): UserSettingsBlob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(anonId));
    if (!raw) return null;
    return parseSettingsJson(raw);
  } catch {
    return null;
  }
}

export function writeCachedSettings(anonId: string, blob: UserSettingsBlob) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(anonId), JSON.stringify(blob));
  } catch {
    /* ignore quota */
  }
  applyPreferencesToDocument(blob.preferences);
}

/** @deprecated device-global prefs — use per-user cache / API */
export function readPreferences(): UserPreferences {
  return { ...DEFAULT_PREFERENCES };
}

/** @deprecated */
export function writePreferences(prefs: UserPreferences) {
  applyPreferencesToDocument(prefs);
}

/** Reflect prefs that affect global UI (a11y). */
export function applyPreferencesToDocument(prefs: UserPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-reduce-motion", prefs.reduceMotion ? "1" : "0");
  root.setAttribute("data-font-scale", prefs.fontScale);
  root.lang = prefs.language || "en";
}
