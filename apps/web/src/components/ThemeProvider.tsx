"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  THEMES,
  isThemeId,
  themeById,
  type ThemeDef,
  type ThemeId,
} from "@/lib/themes";

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemeDef;
  themes: ThemeDef[];
  setThemeId: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", id);
  // Defer meta read until CSS variables from data-theme are applied
  requestAnimationFrame(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const chrome = getComputedStyle(root).getPropertyValue("--chrome").trim();
    if (meta && chrome) meta.setAttribute("content", chrome);
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeId(raw)) {
        setThemeIdState(raw);
        applyTheme(raw);
        return;
      }
    } catch {
      /* ignore */
    }
    applyTheme(DEFAULT_THEME_ID);
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    applyTheme(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme: themeById(themeId),
        themes: THEMES,
        setThemeId,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
