import { rules, templates } from "@/lib/config";

/** Public product launch — values from `config/rules.json` + `config/templates.json`. */
export const PUBLIC_LAUNCH_ISO = rules.launch().publicLaunchIsoDate;
export const PUBLIC_LAUNCH_LABEL = templates.launch().publicLaunchLabel;

/** Primary advertising line. */
export const BRAND_TAGLINE = templates.brand().tagline;

/** Short supporting line under the tagline. */
export const BRAND_SUPPORT = templates.brand().support;
