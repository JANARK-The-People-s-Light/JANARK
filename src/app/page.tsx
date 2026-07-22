import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { PORTAL_BASE, portalHref } from "@/lib/paths";

export const metadata = {
  title: "Coming soon · Janark",
  description:
    "Janark opens 15 August 2026 — an independent civic platform for public discussion.",
};

export default function ComingSoonPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-navy text-cream">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-[28rem] w-[28rem] rounded-full bg-amber/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-saffron/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #f5e6c8 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16 sm:px-8">
        <div className="animate-rise flex flex-wrap items-center justify-between gap-4">
          <BrandLogo size="lg" withWordmark onDark priority />
          <nav
            className="flex items-center gap-5 text-sm text-sand/70"
            aria-label="Site"
          >
            <Link
              href={portalHref("/about")}
              className="transition hover:text-amber-bright"
            >
              About
            </Link>
            <Link
              href={portalHref("/terms")}
              className="transition hover:text-amber-bright"
            >
              Terms
            </Link>
          </nav>
        </div>

        <p className="animate-rise-delay mt-10 text-xs uppercase tracking-[0.28em] text-sand/55">
          Public launch · 15 August 2026
        </p>
        <h1 className="animate-rise font-display mt-3 text-4xl leading-tight text-amber-bright sm:text-5xl md:text-6xl">
          Coming soon
        </h1>
        <p className="animate-rise mt-4 max-w-xl text-base leading-relaxed text-sand/80 sm:text-lg">
          An independent civic platform for public discussion, petitions,
          reports, and community voting. Opens{" "}
          <time dateTime="2026-08-15" className="font-semibold text-cream">
            15 August 2026
          </time>
          .
        </p>

        <div className="animate-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={PORTAL_BASE}
            className="inline-flex items-center justify-center bg-amber px-6 py-3.5 text-sm font-semibold text-navy transition hover:bg-amber-bright"
          >
            Preview the portal
          </Link>
          <p className="text-sm text-sand/50 sm:ml-2">
            Early access · work in progress
          </p>
        </div>
      </div>
    </div>
  );
}
