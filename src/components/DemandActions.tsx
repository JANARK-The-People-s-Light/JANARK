"use client";

import { EngageBar } from "@/components/EngageBar";

/** @deprecated Use EngageBar — kept as thin wrapper for older imports */
export function DemandActions({ demandId }: { demandId: string }) {
  return (
    <EngageBar
      targetType="demand"
      targetId={demandId}
      sharePath={`/demands/${demandId}`}
      shareTitle="Public demand on Janark"
      shareText="Public demand on Janark"
    />
  );
}
