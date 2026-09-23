import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import {
  IconBallot,
  IconCalendar,
  IconChat,
  IconCode,
  IconFlag,
  IconGithub,
  IconMapPin,
  IconMegaphone,
  IconSearch,
  IconUser,
} from "@/components/Icons";
import {
  fill,
  publicLink,
  sys,
  templates,
} from "@/lib/config";
import {
  BRAND_SUPPORT,
  BRAND_TAGLINE,
  PUBLIC_LAUNCH_ISO,
  PUBLIC_LAUNCH_LABEL,
} from "@/lib/launch";
import { PORTAL_BASE, portalHref } from "@/lib/paths";
import { LandingContributeActions } from "@/components/LandingContributeActions";

const FEATURE_ICONS = {
  chat: IconChat,
  mapPin: IconMapPin,
  megaphone: IconMegaphone,
  flag: IconFlag,
  ballot: IconBallot,
  search: IconSearch,
} as const;

type FeatureIconKey = keyof typeof FEATURE_ICONS;

function resolveFeatureIcon(key: string) {
  return FEATURE_ICONS[key as FeatureIconKey] ?? IconChat;
}

export function LandingPage() {
  const layout = sys.landing();
  const brand = templates.brand();
  const copy = templates.landing();
  const portalCopy = templates.portal();
  const githubHref = publicLink("github");

  const vars = {
    name: brand.name,
    tagline: BRAND_TAGLINE,
    support: BRAND_SUPPORT,
    launchLabel: PUBLIC_LAUNCH_LABEL,
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-line/80 bg-chrome text-on-chrome">
        <div
          className="mx-auto flex items-center justify-between gap-4 px-5 sm:px-8"
          style={{
            maxWidth: layout.maxWidthPx,
            height: `${layout.headerHeightRem}rem`,
          }}
        >
          <BrandLogo size="md" withWordmark onDark priority />

          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <nav
              className="flex items-center gap-4 text-sm text-on-chrome/75 sm:gap-5"
              aria-label={copy.navAriaLabel}
            >
              <Link
                href={portalHref("/about")}
                className="transition hover:text-amber-bright"
              >
                {portalCopy.about}
              </Link>
              <Link
                href={portalHref("/terms")}
                className="transition hover:text-amber-bright"
              >
                {portalCopy.termsShort}
              </Link>
            </nav>

            <span
              className="inline-flex max-w-[7.5rem] items-center truncate rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-amber-bright/95 sm:max-w-none sm:px-2.5 sm:text-[11px] sm:tracking-[0.12em]"
              title={copy.openSourceBadge}
            >
              {copy.openSourceBadge}
            </span>

            {githubHref ? (
              <a
                href={githubHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-on-chrome/85 transition hover:border-amber-bright/40 hover:bg-white/10 hover:text-amber-bright"
                aria-label={copy.githubAriaLabel}
              >
                <IconGithub className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full flex-1 px-5 sm:px-8"
        style={{ maxWidth: layout.maxWidthPx }}
      >
        {/* Hero */}
        <section
          className="flex flex-col justify-center py-10 sm:py-12 lg:py-14"
          style={{ minHeight: `${layout.heroMinHeightRem}rem` }}
        >
          <div className="min-w-0 max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
              <IconCalendar className="h-3.5 w-3.5 text-saffron" aria-hidden />
              <time dateTime={PUBLIC_LAUNCH_ISO}>
                {fill(copy.launchBadge, vars)}
              </time>
            </p>

            <BrandLogo
              size={(layout.heroLogoSize as "sm" | "md" | "lg" | "hero") || "hero"}
              withWordmark
              onDark={false}
              priority
              className="mb-7"
            />

            <h1 className="font-display text-4xl leading-[1.12] tracking-tight text-navy sm:text-5xl lg:text-[3.25rem]">
              {BRAND_TAGLINE}
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {BRAND_SUPPORT} Opens{" "}
              <time
                dateTime={PUBLIC_LAUNCH_ISO}
                className="font-semibold text-navy"
              >
                {PUBLIC_LAUNCH_LABEL}
              </time>
              .
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={PORTAL_BASE}
                className="inline-flex items-center justify-center rounded-xl bg-amber px-6 py-3.5 text-sm font-semibold text-on-amber shadow-[0_1px_0_rgba(2,39,75,0.06)] transition hover:bg-amber-bright"
              >
                {copy.previewCta}
              </Link>
              <p className="text-sm text-muted sm:ml-1">{copy.earlyAccess}</p>
            </div>
          </div>
        </section>

        {/* Features — six lightweight blocks */}
        <section className="border-t border-line/70 py-10 sm:py-12" aria-labelledby="landing-features-heading">
          <h2
            id="landing-features-heading"
            className="sr-only"
          >
            {copy.featuresHeading}
          </h2>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-5">
            {copy.features.map((feature) => {
              const Icon = resolveFeatureIcon(feature.icon);
              return (
                <li key={feature.id} className="min-w-0 text-center xl:text-left">
                  <span
                    className="mx-auto inline-flex items-center justify-center rounded-full border border-line bg-cream text-navy xl:mx-0"
                    style={{
                      width: `${layout.featureIconSizeRem}rem`,
                      height: `${layout.featureIconSizeRem}rem`,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-navy">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-[13px]">
                    {feature.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Contribution banner */}
        <section className="pb-12 sm:pb-14">
          <div className="flex flex-col gap-6 rounded-2xl border border-line bg-cream/80 px-5 py-6 shadow-[0_1px_0_rgba(2,39,75,0.04)] sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:py-7">
            <div className="flex min-w-0 items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-chrome text-on-chrome">
                <IconCode className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-navy">
                  {fill(copy.contribute.title, vars)}
                </h2>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
                  {copy.contribute.body}
                </p>
              </div>
            </div>

            <LandingContributeActions actions={copy.contribute.actions} />
          </div>
        </section>

        {/* Maintainers callout */}
        <section className="pb-12 sm:pb-14">
          <div className="flex flex-col gap-6 rounded-2xl border border-line bg-chrome px-5 py-6 text-on-chrome shadow-[0_1px_0_rgba(2,39,75,0.04)] sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:py-7">
            <div className="flex min-w-0 items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber text-on-amber">
                <IconUser className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-amber-bright">
                  {fill(copy.maintainers.title, vars)}
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-on-chrome/75">
                  {fill(copy.maintainers.body, vars)}
                </p>
              </div>
            </div>
            <Link
              href={copy.maintainers.href || sys.paths().maintainersApply}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber px-6 py-3.5 text-sm font-semibold text-on-amber transition hover:bg-amber-bright"
            >
              {copy.maintainers.cta}
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-auto shrink-0 border-t border-line/80 bg-cream/50">
        <div
          className="mx-auto flex flex-col px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
          style={{
            maxWidth: layout.maxWidthPx,
            paddingTop: `${layout.footerPaddingYRem}rem`,
            paddingBottom: `${layout.footerPaddingYRem}rem`,
            gap: `${layout.footerGapRem}rem`,
          }}
        >
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-navy">
              <IconCalendar className="h-4 w-4 text-saffron" />
              <time dateTime={PUBLIC_LAUNCH_ISO}>
                {fill(copy.footer.launchLine, vars)}
              </time>
            </p>
            <p className="mt-0.5 max-w-md text-xs leading-snug text-muted">
              {copy.footer.support}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <Link
              href={portalHref("/about")}
              className="transition hover:text-navy"
            >
              {portalCopy.about}
            </Link>
            <Link
              href={portalHref("/terms")}
              className="transition hover:text-navy"
            >
              {portalCopy.termsShort}
            </Link>
            <span className="font-display text-sm tracking-tight text-navy">
              {brand.name}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
