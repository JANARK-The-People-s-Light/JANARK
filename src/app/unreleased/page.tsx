import Link from "next/link";
import { HomeTrending } from "@/components/HomeTrending";
import { portalHref } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function PortalHomePage() {
  return (
    <>
      <section className="hero-atmosphere relative overflow-hidden text-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-12 -top-8 h-48 w-48 rounded-full bg-amber/25 blur-3xl" />
          <div className="absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-saffron/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="animate-rise min-w-0 max-w-xl">
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-sand/50">
                Unreleased preview
              </p>
              <h1 className="font-display text-lg leading-snug text-amber-bright sm:text-xl">
                for the people, by the people
              </h1>
              <p className="mt-1.5 text-sm text-sand/75">
                Independent civic square — a non-profit for the people, not a
                party or portal.
              </p>
            </div>

            <div className="animate-rise-delay flex shrink-0 flex-wrap gap-2">
              <Link
                href={portalHref("/demands/new")}
                className="bg-amber px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-amber-bright"
              >
                Raise a demand
              </Link>
              <Link
                href={portalHref("/reports/new")}
                className="px-1 py-2.5 text-sm text-sand/80 transition hover:text-amber-bright"
              >
                Report an issue
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeTrending />
    </>
  );
}
