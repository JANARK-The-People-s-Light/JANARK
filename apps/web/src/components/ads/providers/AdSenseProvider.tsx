"use client";

import { AD_CONFIG } from "@/config/ads";

type Props = {
  slotId: string;
  reservedHeight: number;
};

export function AdSenseProvider({ slotId, reservedHeight }: Props) {
  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "block",
        width: "100%",
        minHeight: reservedHeight,
      }}
      data-ad-client={AD_CONFIG.publisherId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
