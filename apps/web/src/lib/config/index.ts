import sysJson from "../../../../../config/sys.json";
import rulesJson from "../../../../../config/rules.json";
import templatesJson from "../../../../../config/templates.json";
import schemaJson from "../../../../../config/schema.json";
import fallbacksJson from "../../../../../config/fallbacks.json";
import maintainersJson from "../../../../../config/maintainers.json";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const pillars = {
  sys: sysJson as Json,
  rules: rulesJson as Json,
  templates: templatesJson as unknown as Json,
  schema: schemaJson as Json,
  fallbacks: fallbacksJson as Json,
  maintainers: maintainersJson as unknown as Json,
} as const;

export type ConfigPillar = keyof typeof pillars;

function isRecord(v: Json): v is { [k: string]: Json } {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function readPath(root: Json, path: string): Json | undefined {
  if (!path) return root;
  const parts = path.split(".").filter(Boolean);
  let cur: Json | undefined = root;
  for (const p of parts) {
    if (cur === undefined || !isRecord(cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Resolve a dotted path from a pillar; on miss, try `fallbacks.json` then throw.
 * Never invent inline defaults at call sites — extend fallbacks instead.
 */
export function cfg<T = Json>(
  pillar: Exclude<ConfigPillar, "fallbacks">,
  path: string,
): T {
  const primary = readPath(pillars[pillar], path);
  if (primary !== undefined) return primary as T;
  const fb = readPath(pillars.fallbacks, path);
  if (fb !== undefined) return fb as T;
  throw new Error(
    `Missing config ${pillar}.${path} (no entry in config/fallbacks.json)`,
  );
}

/** Fill `{token}` placeholders from templates. Missing tokens use empty string via fallbacks path if provided. */
export function fill(
  template: string,
  vars: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

export const sys = {
  portal: () => cfg<typeof sysJson.portal>("sys", "portal"),
  landing: () => cfg<typeof sysJson.landing>("sys", "landing"),
  brandMark: () => cfg<typeof sysJson.brandMark>("sys", "brandMark"),
  links: () => cfg<typeof sysJson.links>("sys", "links"),
  envKeys: () => cfg<typeof sysJson.envKeys>("sys", "envKeys"),
  paths: () => cfg<typeof sysJson.paths>("sys", "paths"),
  publicMarketingPaths: () =>
    cfg<string[]>("sys", "publicMarketingPaths"),
  session: () => cfg<typeof sysJson.session>("sys", "session"),
  userAgents: () => cfg<typeof sysJson.userAgents>("sys", "userAgents"),
};

/** Resolve a named public link; env overrides `sys.links` when the env key is set. */
export function publicLink(
  key: keyof typeof sysJson.links,
): string {
  const links = sys.links();
  const envKeys = sys.envKeys() as Record<string, string>;
  if (key === "github") {
    const envName = envKeys.githubUrl;
    const fromEnv =
      typeof process !== "undefined" && envName
        ? process.env[envName]?.trim()
        : undefined;
    if (fromEnv) return fromEnv;
  }
  return links[key] ?? "";
}

export const rules = {
  auth: () => cfg<typeof rulesJson.auth>("rules", "auth"),
  portal: () => cfg<typeof rulesJson.portal>("rules", "portal"),
  launch: () => cfg<typeof rulesJson.launch>("rules", "launch"),
  feed: () => cfg<typeof rulesJson.feed>("rules", "feed"),
  features: () => cfg<typeof rulesJson.features>("rules", "features"),
  maintainerApply: () =>
    cfg<typeof rulesJson.maintainerApply>("rules", "maintainerApply"),
  landingFeedback: () =>
    cfg<typeof rulesJson.landingFeedback>("rules", "landingFeedback"),
  interactions: () =>
    cfg<typeof rulesJson.interactions>("rules", "interactions"),
};

export const templates = {
  brand: () => cfg<typeof templatesJson.brand>("templates", "brand"),
  landing: () => cfg<typeof templatesJson.landing>("templates", "landing"),
  portal: () => cfg<typeof templatesJson.portal>("templates", "portal"),
  launch: () => cfg<typeof templatesJson.launch>("templates", "launch"),
};

/** Whole maintainers form config object (fields + copy). */
export function getMaintainersForm() {
  return maintainersJson;
}

export const schema = {
  raw: () => schemaJson,
};

export function isPublicMarketingPath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return sys.publicMarketingPaths().includes(normalized);
}
