import Image from "next/image";
import { sys, templates } from "@/lib/config";

type LogoSize = "sm" | "md" | "lg" | "hero";

type Props = {
  /** Visual size of the mark */
  size?: LogoSize;
  /** Show wordmark next to the mark */
  withWordmark?: boolean;
  /** Light text for navy backgrounds */
  onDark?: boolean;
  className?: string;
  priority?: boolean;
  /** Override mark src (defaults to solid or primary path from config) */
  src?: string;
};

const SIZES: Record<
  LogoSize,
  { px: number; className: string; wordmark: string }
> = {
  sm: { px: 28, className: "h-7 w-7", wordmark: "text-xl sm:text-2xl" },
  md: { px: 40, className: "h-10 w-10", wordmark: "text-xl sm:text-2xl" },
  lg: { px: 56, className: "h-14 w-14", wordmark: "text-2xl" },
  hero: {
    px: 120,
    className: "h-[6.5rem] w-[6.5rem] sm:h-32 sm:w-32",
    wordmark: "text-3xl sm:text-5xl",
  },
};

/** Janark mark — asset path and name from `config/sys.json` + `config/templates.json`. */
export function BrandLogo({
  size = "md",
  withWordmark = false,
  onDark = true,
  className = "",
  priority = false,
  src,
}: Props) {
  const s = SIZES[size];
  const brand = templates.brand();
  const paths = sys.paths();
  const mark = sys.brandMark();
  const markSrc =
    src ??
    (mark.useSolidAsset ? paths.brandLogoSolid : paths.brandLogo);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`${s.className} inline-flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-[0_1px_0_rgba(2,39,75,0.06)]`}
        style={{
          padding: `${mark.backdropPaddingRem}rem`,
          borderRadius: `${mark.backdropRadiusRem}rem`,
          boxShadow: `0 0 0 ${mark.ringWidthPx}px rgba(2,39,75,0.08), 0 1px 0 rgba(2,39,75,0.06)`,
        }}
      >
        <Image
          src={markSrc}
          alt={brand.name}
          width={s.px}
          height={s.px}
          priority={priority}
          className="h-full w-full object-contain"
        />
      </span>
      {withWordmark ? (
        <span
          className={`font-display tracking-tight ${s.wordmark} ${
            onDark ? "text-on-chrome" : "text-navy"
          }`}
        >
          {brand.name}
        </span>
      ) : null}
    </span>
  );
}
