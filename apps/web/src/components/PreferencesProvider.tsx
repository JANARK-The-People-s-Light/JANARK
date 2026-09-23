"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthModal";
import { useTheme } from "@/components/ThemeProvider";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_SETTINGS,
  applyPreferencesToDocument,
  normalizePreferences,
  normalizeSettingsBlob,
  readCachedSettings,
  writeCachedSettings,
  type UserPreferences,
  type UserSettingsBlob,
} from "@/lib/user-preferences";
import type { ThemeId } from "@/lib/themes";

type PrefsContextValue = {
  prefs: UserPreferences;
  /** True while loading server settings for a logged-in user */
  loading: boolean;
  /** Settings require login to edit */
  canEdit: boolean;
  updatePrefs: (patch: Partial<UserPreferences>) => void;
  setThemePreference: (themeId: ThemeId) => void;
  resetPrefs: () => void;
  refreshSettings: () => Promise<void>;
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

async function fetchSettings(): Promise<UserSettingsBlob | null> {
  try {
    const res = await fetch("/api/preferences", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { settings?: UserSettingsBlob };
    return data.settings ? normalizeSettingsBlob(data.settings) : null;
  } catch {
    return null;
  }
}

async function patchSettings(
  body: Partial<UserSettingsBlob> & {
    preferences?: Partial<UserPreferences>;
  },
): Promise<UserSettingsBlob | null> {
  try {
    const res = await fetch("/api/preferences", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { settings?: UserSettingsBlob };
    return data.settings ? normalizeSettingsBlob(data.settings) : null;
  } catch {
    return null;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { themeId, setThemeId } = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const anonId = session?.anonId ?? null;
  const canEdit = Boolean(anonId);
  const saveSeq = useRef(0);
  const themeIdRef = useRef(themeId);
  useEffect(() => {
    themeIdRef.current = themeId;
  }, [themeId]);

  const applyBlob = useCallback(
    (blob: UserSettingsBlob, cacheAnon?: string | null) => {
      setPrefs(blob.preferences);
      applyPreferencesToDocument(blob.preferences);
      setThemeId(blob.themeId);
      if (cacheAnon) writeCachedSettings(cacheAnon, blob);
    },
    [setThemeId],
  );

  const refreshSettings = useCallback(async () => {
    if (!anonId) {
      // Logged out: clear preference DOM attrs but keep device theme (ThemeProvider / localStorage).
      setPrefs({ ...DEFAULT_PREFERENCES });
      applyPreferencesToDocument(DEFAULT_PREFERENCES);
      return;
    }
    setLoading(true);
    try {
      const cached = readCachedSettings(anonId);
      if (cached) applyBlob(cached, anonId);

      const remote = await fetchSettings();
      if (remote) {
        applyBlob(remote, anonId);
      } else if (!cached) {
        // First login — seed server from defaults (or migrate old device prefs once)
        const seeded = normalizeSettingsBlob(DEFAULT_SETTINGS);
        const saved = await patchSettings(seeded);
        applyBlob(saved ?? seeded, anonId);
      }
    } finally {
      setLoading(false);
    }
  }, [anonId, applyBlob]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const persist = useCallback(
    async (blob: UserSettingsBlob) => {
      if (!anonId) return;
      const seq = ++saveSeq.current;
      writeCachedSettings(anonId, blob);
      const saved = await patchSettings({
        preferences: blob.preferences,
        themeId: blob.themeId,
      });
      if (saved && seq === saveSeq.current) {
        applyBlob(saved, anonId);
      }
    },
    [anonId, applyBlob],
  );

  const updatePrefs = useCallback(
    (patch: Partial<UserPreferences>) => {
      if (!anonId) return;
      setPrefs((prev) => {
        const preferences = normalizePreferences({ ...prev, ...patch });
        applyPreferencesToDocument(preferences);
        void persist({ preferences, themeId: themeIdRef.current });
        return preferences;
      });
    },
    [anonId, persist],
  );

  const setThemePreference = useCallback(
    (themeId: ThemeId) => {
      if (!anonId) {
        setThemeId(themeId);
        return;
      }
      setThemeId(themeId);
      setPrefs((prev) => {
        const blob = { preferences: prev, themeId };
        void persist(blob);
        return prev;
      });
    },
    [anonId, persist, setThemeId],
  );

  const resetPrefs = useCallback(() => {
    if (!anonId) return;
    const blob = {
      preferences: { ...DEFAULT_PREFERENCES },
      themeId: themeIdRef.current,
    };
    applyBlob(blob, anonId);
    void persist(blob);
  }, [anonId, applyBlob, persist]);

  return (
    <PrefsContext.Provider
      value={{
        prefs,
        loading,
        canEdit,
        updatePrefs,
        setThemePreference,
        resetPrefs,
        refreshSettings,
      }}
    >
      {children}
    </PrefsContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PrefsContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
