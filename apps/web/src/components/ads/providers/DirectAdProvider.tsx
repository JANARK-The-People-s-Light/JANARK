"use client";

type Props = {
  reservedHeight: number;
  label: string;
};

/** Direct sold inventory — DOM reserved; creatives wired via config later. */
export function DirectAdProvider({ reservedHeight, label }: Props) {
  return (
    <div
      className="flex w-full items-center justify-center rounded-lg border border-line/70 bg-cream/60 text-xs text-muted"
      style={{ minHeight: reservedHeight }}
      data-ad-provider="direct"
    >
      {label}
    </div>
  );
}
