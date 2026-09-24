import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { IconGithub } from "@/components/Icons";
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
    <div className="landing-stage relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
      <div className="landing-hero-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-hero-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <article
        className="landing-card animate-rise relative z-10 w-full overflow-hidden border border-white/15 bg-white shadow-[0_24px_80px_-28px_rgba(2,39,75,0.55)]"
        style={{
          maxWidth: layout.maxWidthPx,
          maxHeight: `${layout.cardMaxHeightVh}vh`,
          borderRadius: `${layout.cardRadiusRem}rem`,
        }}
      >
        {/* Card top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-line/70 bg-chrome px-6 py-4 sm:px-9">
          <BrandLogo size="md" onDark priority />
          <div className="flex items-center gap-1">
            <nav
              className="flex items-center text-sm text-on-chrome/75"
              aria-label={copy.navAriaLabel}
            >
              <Link
                href={portalHref("/about")}
                className="rounded-md px-2.5 py-1.5 transition hover:bg-white/10 hover:text-on-chrome"
              >
                {portalCopy.about}
              </Link>
              <Link
                href={portalHref("/terms")}
                className="rounded-md px-2.5 py-1.5 transition hover:bg-white/10 hover:text-on-chrome"
              >
                {portalCopy.termsShort}
              </Link>
            </nav>
            {githubHref ? (
              <a
                href={githubHref}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-on-chrome/80 transition hover:bg-white/10 hover:text-amber-bright"
                aria-label={copy.githubAriaLabel}
              >
                <IconGithub className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="px-6 py-8 sm:px-9 sm:py-10">
          {/* Hero block */}
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-amber animate-pulse-soft"
              aria-hidden
            />
            <time dateTime={PUBLIC_LAUNCH_ISO}>
              {fill(copy.launchBadge, vars)}
            </time>
          </p>

          <p className="mt-4 font-display text-4xl leading-none tracking-tight text-navy sm:text-5xl">
            {brand.name}
          </p>

          <h1 className="mt-3 max-w-xl font-display text-xl leading-snug tracking-tight text-navy sm:text-2xl">
            {fill(copy.heroHeadline, vars)}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {fill(copy.heroBody, vars)}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={PORTAL_BASE}
              className="inline-flex items-center justify-center rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-on-amber transition hover:bg-amber-bright"
            >
              {fill(copy.exploreCta, vars)}
            </Link>
            {githubHref ? (
              <a
                href={githubHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2.5 text-sm font-medium text-navy transition hover:border-amber/50 hover:bg-cream"
              >
                {copy.viewSourceCta}
                <span className="transition group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </a>
            ) : null}
          </div>

          {/* Pillars */}
          <section
            className="mt-8 border-t border-line/80 pt-6"
            aria-labelledby="landing-pillars-heading"
          >
            <h2 id="landing-pillars-heading" className="sr-only">
              {fill(copy.pillarsHeading, vars)}
            </h2>
            <ul className="grid gap-5 sm:grid-cols-3 sm:gap-4">
              {copy.pillars.map((pillar) => (
                <li key={pillar.id} className="min-w-0">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-saffron">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 font-display text-base leading-snug text-navy sm:text-lg">
                    {pillar.body}
                  </p>
                </li>
              ))}
            </ul>
            <p
              className="mt-5 text-xs tracking-wide text-muted sm:text-sm"
              aria-label={copy.capabilitiesHeading}
            >
              {copy.capabilities.join(" · ")}
            </p>
          </section>

          {/* Contribute + maintain */}
          <section className="mt-7 grid gap-6 border-t border-line/80 pt-6 sm:grid-cols-2 sm:gap-8">
            <div aria-labelledby="landing-contribute-heading">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-saffron">
                {copy.contribute.eyebrow}
              </p>
              <h2
                id="landing-contribute-heading"
                className="mt-1.5 font-display text-xl tracking-tight text-navy"
              >
                {fill(copy.contribute.title, vars)}
              </h2>
              <p className="mt-1 text-sm text-muted">{copy.contribute.body}</p>
              <div className="mt-3">
                <LandingContributeActions
                  actions={copy.contribute.actions}
                  variant="buttons"
                />
              </div>
            </div>

            <div
              className="rounded-xl bg-chrome px-5 py-5 text-on-chrome sm:px-6"
              aria-labelledby="landing-maintainers-heading"
            >
              <h2
                id="landing-maintainers-heading"
                className="font-display text-xl tracking-tight text-on-chrome"
              >
                {fill(copy.maintainers.title, vars)}
              </h2>
              <p className="mt-1.5 text-sm text-on-chrome/70">
                {fill(copy.maintainers.body, vars)}
              </p>
              <Link
                href={copy.maintainers.href || sys.paths().maintainersApply}
                className="mt-4 inline-flex items-center justify-center rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-on-amber transition hover:bg-amber-bright"
              >
                {copy.maintainers.cta}
              </Link>
            </div>
          </section>
        </div>

        {/* Card footer */}
        <footer className="flex flex-col gap-2 border-t border-line/70 bg-cream/60 px-5 py-3.5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p>
            <time dateTime={PUBLIC_LAUNCH_ISO} className="font-medium text-navy">
              {fill(copy.footer.launchLine, vars)}
            </time>
            <span className="mx-1.5 text-line" aria-hidden>
              ·
            </span>
            {copy.footer.support}
          </p>
          <div className="flex items-center gap-3">
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
          </div>
        </footer>
      </article>
    </div>
  );
}
