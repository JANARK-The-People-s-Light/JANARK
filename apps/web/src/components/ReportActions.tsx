"use client";

import { EngageBar } from "@/components/EngageBar";

/** @deprecated Use EngageBar — kept as thin wrapper for older imports */
export function ReportActions({ reportId }: { reportId: string }) {
  return (
    <EngageBar
      targetType="report"
      targetId={reportId}
      sharePath={`/reports/${reportId}`}
      shareTitle="Citizen report on Janark"
      shareText="Anonymous citizen report on Janark"
    />
  );
}
