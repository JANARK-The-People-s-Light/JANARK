"use client";

import { useEffect } from "react";
import {
  AD_CONFIG,
  AD_PLACEMENTS,
  type AdPlacementKey,
} from "@/config/ads";
import { fill } from "@/lib/config";
import { AdSenseProvider } from "@/components/ads/providers/AdSenseProvider";
import { DirectAdProvider } from "@/components/ads/providers/DirectAdProvider";
import { HouseAdProvider } from "@/components/ads/providers/HouseAdProvider";

type AdSlotProps = {
  placement: AdPlacementKey;
  className?: string;
};

export function AdSlot({ placement, className = "" }: AdSlotProps) {
  const config = AD_PLACEMENTS[placement];
  const copy = AD_CONFIG.copy;

  // Hooks must run unconditionally (stable call order).
  useEffect(() => {
    if (
      !AD_CONFIG.enabled ||
      !config ||
      !config.enabled ||
      config.provider !== "adsense" ||
      !config.slotId ||
      !AD_CONFIG.publisherId ||
      (AD_CONFIG.isDev && !AD_CONFIG.loadScriptInDev)
    ) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.error("AdSense delivery error:", error);
    }
  }, [config]);

  if (!AD_CONFIG.enabled || !config || !config.enabled) {
    return null;
  }

  const providerMeta = AD_CONFIG.providers[config.provider];
  if (!providerMeta?.enabled) {
    return null;
  }

  if (AD_CONFIG.isDev && AD_CONFIG.showPlaceholdersInDev) {
    return (
      <div
        className={`ad-placeholder my-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cream/50 p-2 text-xs text-muted ${className}`}
        style={{ minHeight: `${config.reservedHeight}px` }}
        data-placement={placement}
      >
        <span className="font-semibold">{copy.devPlaceholderTitle}</span>
        <span>
          {fill(copy.devPlacement, { placement })}
        </span>
        <span>
          {fill(copy.devFormat, {
            format: config.format,
            height: config.reservedHeight,
          })}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`ad-slot my-4 flex w-full flex-col items-center justify-center overflow-hidden ${className}`}
      data-placement={placement}
      style={{ minHeight: `${config.reservedHeight}px` }}
    >
      {config.label ? (
        <span className="mb-1 self-start text-[10px] uppercase tracking-wider text-muted">
          {config.label}
        </span>
      ) : null}

      {config.provider === "adsense" && config.slotId ? (
        <AdSenseProvider
          slotId={config.slotId}
          reservedHeight={config.reservedHeight}
        />
      ) : null}

      {config.provider === "house" ? (
        <HouseAdProvider reservedHeight={config.reservedHeight} />
      ) : null}

      {config.provider === "direct" ? (
        <DirectAdProvider
          reservedHeight={config.reservedHeight}
          label={config.label}
        />
      ) : null}
    </div>
  );
}
