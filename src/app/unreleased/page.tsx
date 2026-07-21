import { CreateActionMenu } from "@/components/CreateActionMenu";
import { HomeTrending } from "@/components/HomeTrending";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function PortalHomePage() {
  return (
    <>
      <section className="hero-atmosphere relative text-cream">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -top-8 h-48 w-48 rounded-full bg-amber/25 blur-3xl" />
          <div className="absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-saffron/20 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="animate-rise min-w-0 max-w-xl">
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-sand/50">
              Unreleased preview
            </p>
            <h1 className="font-display text-lg leading-snug text-amber-bright sm:text-xl">
              for us, by us
            </h1>
          </div>
        </div>
      </section>

      <HomeTrending />
    </>
  );
}
