"use client";

import { EngageBar } from "@/components/EngageBar";
import { SignPetitionButton } from "@/components/SignPetitionButton";
import { portalHref } from "@/lib/paths";

type Props = {
  demandId: string;
  supportCount?: number;
  /** Hide comments by default (feed / list) */
  compact?: boolean;
  className?: string;
};

/** Petition sign + upvote/comment bar for a public demand. */
export function DemandActions({
  demandId,
  supportCount,
  compact,
  className = "",
}: Props) {
  return (
    <div className={`space-y-4 ${className}`}>
      <SignPetitionButton
        demandId={demandId}
        initialCount={supportCount}
        compact={compact}
      />
      <EngageBar
        targetType="demand"
        targetId={demandId}
        barOnly={compact}
        sharePath={portalHref(`/petitions/${demandId}`)}
        shareTitle="Petition on Janark"
        shareText="Sign this petition on Janark"
      />
    </div>
  );
}
