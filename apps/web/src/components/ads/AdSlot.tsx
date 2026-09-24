"use client";

import { useEffect, useRef } from "react";
import {
  AD_CONFIG,
  AD_PLACEMENTS,
  type AdPlacementKey,
} from "@/config/ads";
import { fill } from "@/lib/config";
import { trackClientInteraction } from "@/lib/track-client";
import { AdSenseProvider } from "@/components/ads/providers/AdSenseProvider";
import { DirectAdProvider } from "@/components/ads/providers/DirectAdProvider";
import { HouseAdProvider } from "@/components/ads/providers/HouseAdProvider";

type AdSlotProps = {
  placement: AdPlacementKey;
  className?: string;
};

function AdPlaceholder({
  placement,
  className,
  reservedHeight,
}: {
  placement: AdPlacementKey;
  className: string;
  reservedHeight: number;
}) {
  const copy = AD_CONFIG.copy;
  const config = AD_PLACEMENTS[placement];
  return (
    <div
      className={`ad-placeholder my-4 flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-amber bg-amber/10 px-3 py-4 text-center text-xs text-navy ${className}`}
      style={{ minHeight: `${reservedHeight}px` }}
      data-placement={placement}
      data-ad-preview="true"
      role="note"
      aria-label={copy.devPlaceholderTitle}
    >
      <span className="text-sm font-semibold tracking-wide">
        {copy.devPlaceholderTitle}
      </span>
      <span className="font-mono text-[11px] text-muted">
        {fill(copy.devPlacement, { placement })}
      </span>
      {config ? (
        <span className="text-[11px] text-muted">
          {fill(copy.devFormat, {
            format: config.format,
            height: reservedHeight,
          })}
        </span>
      ) : null}
    </div>
  );
}

export function AdSlot({ placement, className = "" }: AdSlotProps) {
  const config = AD_PLACEMENTS[placement];
  const impressed = useRef(false);

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

  useEffect(() => {
    if (!config?.enabled || impressed.current) return;
    if (AD_CONFIG.isDev && AD_CONFIG.showPlaceholdersInDev && !AD_CONFIG.enabled) {
      return;
    }
    if (!AD_CONFIG.enabled && !(AD_CONFIG.isDev && AD_CONFIG.showPlaceholdersInDev)) {
      return;
    }
    impressed.current = true;
    trackClientInteraction("ad.impression", {
      props: {
        placement,
        provider: config.provider,
        format: config.format,
        preview: Boolean(AD_CONFIG.isDev && AD_CONFIG.showPlaceholdersInDev),
      },
    });
  }, [config, placement]);

  // Dev layout markers — visible even when NEXT_PUBLIC_ADS_ENABLED is off
  if (
    config?.enabled &&
    AD_CONFIG.isDev &&
    AD_CONFIG.showPlaceholdersInDev
  ) {
    return (
      <AdPlaceholder
        placement={placement}
        className={className}
        reservedHeight={config.reservedHeight}
      />
    );
  }

  if (!AD_CONFIG.enabled || !config || !config.enabled) {
    return null;
  }

  const providerMeta = AD_CONFIG.providers[config.provider];
  if (!providerMeta?.enabled) {
    return null;
  }

  return (
    <div
      className={`ad-slot my-4 flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-line ${className}`}
      data-placement={placement}
      style={{ minHeight: `${config.reservedHeight}px` }}
      onClick={() => {
        trackClientInteraction("ad.click", {
          props: { placement, provider: config.provider },
        });
      }}
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
