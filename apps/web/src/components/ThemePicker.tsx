"use client";

import { usePreferences } from "@/components/PreferencesProvider";
import { useTheme } from "@/components/ThemeProvider";
import type { ThemeId } from "@/lib/themes";

/**
 * Theme picker — used on Settings (logged-in). Persists to the user account.
 */
export function ThemePicker() {
  const { themeId, themes } = useTheme();
  const { setThemePreference, canEdit } = usePreferences();

  return (
    <div className="space-y-3" role="group" aria-label="Theme">
      <div className="grid gap-2 sm:grid-cols-1">
        {themes.map((t) => {
          const active = themeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={!canEdit}
              onClick={() => setThemePreference(t.id as ThemeId)}
              aria-pressed={active}
              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-amber bg-sand/60 ring-1 ring-amber/40"
                  : "border-line bg-white hover:border-navy/30 hover:bg-sand/30"
              }`}
            >
              <span className="mt-0.5 flex shrink-0 gap-1" aria-hidden>
                {t.swatches.map((c) => (
                  <span
                    key={c}
                    className="h-8 w-5 rounded-md border border-line/80"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-navy">
                  {t.label}
                  {active ? (
                    <span className="ml-2 text-xs font-medium text-link">
                      Active
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {t.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
