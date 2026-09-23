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
  /** Override mark src (defaults to config paths.brandLogo) */
  src?: string;
};

const SIZES: Record<
  LogoSize,
  { px: number; className: string; wordmark: string }
> = {
  sm: { px: 28, className: "h-7 w-7", wordmark: "text-xl sm:text-2xl" },
  md: { px: 36, className: "h-9 w-9", wordmark: "text-xl sm:text-2xl" },
  lg: { px: 48, className: "h-12 w-12", wordmark: "text-2xl" },
  hero: {
    px: 96,
    className: "h-20 w-20 sm:h-24 sm:w-24",
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
  const markSrc = src ?? sys.paths().brandLogo;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={markSrc}
        alt={brand.name}
        width={s.px}
        height={s.px}
        priority={priority}
        className={`${s.className} object-contain`}
      />
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
