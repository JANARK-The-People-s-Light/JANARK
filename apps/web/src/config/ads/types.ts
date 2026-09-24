export type AdProviderType = "adsense" | "gam" | "direct" | "house";

export type AdPlacementKey =
  | "home-top"
  | "feed-top"
  | "feed-middle"
  | "post-bottom"
  | "sidebar"
  | "sidebar-below-trending"
  | "mobile-bottom";

export interface ProviderConfig {
  enabled: boolean;
  name: string;
  type: "programmatic" | "ad-server" | "direct" | "internal";
  scriptUrlTemplate?: string;
}

export interface FormatDimensions {
  width: number | string;
  height: number | string;
}

export interface AdFormat {
  name: string;
  desktop: FormatDimensions;
  mobile: FormatDimensions;
}

export interface PlacementConfig {
  enabled: boolean;
  provider: AdProviderType;
  format: string;
  slotId: string;
  label: string;
  reservedHeight: number;
}

export interface AdRuntimeConfig {
  enabled: boolean;
  publisherId: string;
  isDev: boolean;
  loadScriptInDev: boolean;
  showPlaceholdersInDev: boolean;
  showOnComingSoon: boolean;
  feedMiddleAfterIndex: number;
  feedAdIntervalChoices: number[];
  providers: Record<AdProviderType, ProviderConfig>;
  placements: Record<AdPlacementKey, PlacementConfig>;
  formats: Record<string, AdFormat>;
  copy: Record<string, string>;
  house: {
    hrefKey: string;
    titleKey: string;
    bodyKey: string;
  };
  adsTxtLines: string[];
}
