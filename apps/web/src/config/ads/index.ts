import providersJson from "../../../../../config/ads/providers.json";
import formatsJson from "../../../../../config/ads/formats.json";
import placementsJson from "../../../../../config/ads/placements.json";
import policyJson from "../../../../../config/ads/policy.json";
import copyJson from "../../../../../config/ads/copy.json";
import type {
  AdPlacementKey,
  AdProviderType,
  AdRuntimeConfig,
  PlacementConfig,
  ProviderConfig,
} from "./types";

function env(name: string | undefined): string {
  if (!name) return "";
  return (process.env[name] ?? "").trim();
}

function truthy(value: string): boolean {
  return value === "true" || value === "1" || value === "yes";
}

function fillLine(template: string, publisherId: string): string {
  return template.replace(/\{publisherId\}/g, publisherId);
}

const publisherId = env(policyJson.publisherIdEnv);
const enabled = truthy(env(policyJson.enabledEnv));
const isDev = process.env.NODE_ENV === "development";

const placements = Object.fromEntries(
  Object.entries(placementsJson).map(([key, raw]) => {
    const label =
      (copyJson as Record<string, string>)[raw.labelKey] ?? raw.labelKey;
    const placement: PlacementConfig = {
      enabled: raw.enabled,
      provider: raw.provider as AdProviderType,
      format: raw.format,
      slotId: env(raw.slotIdEnv),
      label,
      reservedHeight: raw.reservedHeight,
    };
    return [key, placement];
  }),
) as Record<AdPlacementKey, PlacementConfig>;

const adsTxtFromEnv = env(policyJson.adsTxt.linesEnv);
const adsTxtLines = adsTxtFromEnv
  ? adsTxtFromEnv.split("\n").map((l) => l.trim()).filter(Boolean)
  : policyJson.adsTxt.defaultLines.map((line) => fillLine(line, publisherId));

export const AD_CONFIG: AdRuntimeConfig = {
  enabled,
  publisherId,
  isDev,
  loadScriptInDev: policyJson.loadScriptInDev,
  showPlaceholdersInDev: policyJson.showPlaceholdersInDev,
  showOnComingSoon: policyJson.showOnComingSoon,
  feedMiddleAfterIndex: policyJson.feedMiddleAfterIndex,
  feedAdIntervalChoices: policyJson.feedAdIntervalChoices,
  providers: providersJson as Record<AdProviderType, ProviderConfig>,
  placements,
  formats: formatsJson,
  copy: copyJson,
  house: policyJson.house,
  adsTxtLines,
};

export const AD_PROVIDERS = AD_CONFIG.providers;
export const AD_PLACEMENTS = AD_CONFIG.placements;
export const AD_FORMATS = AD_CONFIG.formats;

export type { AdPlacementKey, AdProviderType, PlacementConfig };
