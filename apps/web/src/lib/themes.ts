/**
 * Portal theme registry. Tokens map to CSS variables on <html data-theme="…">.
 * Colors + fonts are variable — see src/app/globals.css.
 *
 * Contrast rules (WCAG AA for body/UI text):
 *   --navy / --muted / --link on --background, --white, --sand
 *   --on-chrome on --chrome (header)
 *   --on-amber on --amber / --amber-bright (CTAs) — always dark ink
 *   Use text-link for inline links; text-on-amber on bg-amber buttons
 *
 * Brand palette (themes 1–3):
 *   Deep Navy #02274B · Navy #002E57 · Orange #F89E17 · Dark Gray #5D6264
 *   Golden Yellow #FFC83D · Light Yellow #FFE7A3 · White #FFFFFF
 */

export type ThemeId =
  | "brand-day"
  | "brand-warm"
  | "brand-night"
  | "monsoon"
  | "ember-graphite";

export type ThemeDef = {
  id: ThemeId;
  label: string;
  description: string;
  /** Swatch colors for the picker (left → right) */
  swatches: [string, string, string];
  /** Header / chrome sits on a dark bar (wordmark onDark) */
  darkChrome: boolean;
};

export const THEMES: ThemeDef[] = [
  {
    id: "brand-day",
    label: "Brand Day",
    description:
      "White surfaces, deep navy type, orange actions — official Janark light.",
    swatches: ["#FFFFFF", "#002E57", "#F89E17"],
    darkChrome: true,
  },
  {
    id: "brand-warm",
    label: "Brand Warm",
    description:
      "Light yellow paper wash with the same navy and orange brand marks.",
    swatches: ["#FFE7A3", "#02274B", "#F89E17"],
    darkChrome: true,
  },
  {
    id: "brand-night",
    label: "Brand Night",
    description:
      "Deep navy canvas, white type, golden accents — brand colors after dark.",
    swatches: ["#02274B", "#FFFFFF", "#FFC83D"],
    darkChrome: true,
  },
  {
    id: "monsoon",
    label: "Monsoon",
    description:
      "Teal civic mist — water-and-sky palette for long reading sessions.",
    swatches: ["#E8F1F2", "#0B3D4A", "#2A9D8F"],
    darkChrome: true,
  },
  {
    id: "ember-graphite",
    label: "Ember Graphite",
    description:
      "Charcoal surfaces with ember actions — focused night mode without brand navy.",
    swatches: ["#1C1917", "#FAFAF9", "#EA580C"],
    darkChrome: true,
  },
];

export const DEFAULT_THEME_ID: ThemeId = "brand-day";
export const THEME_STORAGE_KEY = "janark-theme-v1";

export function isThemeId(v: string | null | undefined): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}

export function themeById(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}
