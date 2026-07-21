import Image from "next/image";

type Props = {
  /** Visual size of the mark */
  size?: "sm" | "md" | "lg" | "hero";
  /** Show wordmark next to the mark */
  withWordmark?: boolean;
  /** Light text for navy backgrounds */
  onDark?: boolean;
  className?: string;
  priority?: boolean;
};

const SIZES = {
  sm: { px: 28, className: "h-7 w-7" },
  md: { px: 36, className: "h-9 w-9" },
  lg: { px: 48, className: "h-12 w-12" },
  hero: { px: 96, className: "h-20 w-20 sm:h-24 sm:w-24" },
} as const;

/** Janark mark from data/logo (served via /logo/janark.png) */
export function BrandLogo({
  size = "md",
  withWordmark = false,
  onDark = true,
  className = "",
  priority = false,
}: Props) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo/janark.png"
        alt="Janark"
        width={s.px}
        height={s.px}
        priority={priority}
        className={`${s.className} object-contain`}
      />
      {withWordmark ? (
        <span
          className={`font-display tracking-tight ${
            size === "hero"
              ? "text-3xl sm:text-5xl"
              : size === "lg"
                ? "text-2xl"
                : "text-xl sm:text-2xl"
          } ${onDark ? "text-cream" : "text-navy"}`}
        >
          Janark
        </span>
      ) : null}
    </span>
  );
}
