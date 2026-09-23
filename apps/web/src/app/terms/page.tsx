import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { TermsFaqList } from "@/components/TermsFaqList";
import {
  CIVIC_POST_TERMS_FAQS,
  CIVIC_POST_TERMS_SECTIONS,
  CIVIC_POST_TERMS_TITLE,
  CIVIC_POST_TERMS_VERSION,
} from "@/lib/civic-post-terms";
import { portalHref } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Civic Posting Terms & Conditions",
  description:
    "Janark Civic Posting Terms — non-profit civic organisation; non-partisan rules, user responsibility, and platform non-liability for user-generated content.",
};

const HIGHLIGHTS = [
  {
    title: "Non-profit organisation",
    body: "Janark is operated as a non-profit civic organisation for public benefit — not a for-profit social network or partisan tool.",
  },
  {
    title: "You are responsible",
    body: "Everything you publish is yours. Your anonymity ID does not shift legal responsibility to Janark.",
  },
  {
    title: "Platform not liable",
    body: "Janark hosts civic speech. It does not author, endorse, or verify posts, and is not responsible for user content.",
  },
  {
    title: "No party promotion",
    body: "No campaigning for parties or candidates. Discuss policy and public services — not partisan advertising.",
  },
  {
    title: "Not official advice",
    body: "Not a government portal, court, or emergency service. Use authorised channels for FIRs, courts, and crises.",
  },
] as const;

function sectionAnchor(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function TermsPage() {
  return (
    <>
      <section className="hero-atmosphere relative overflow-hidden text-on-chrome">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-amber/35 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-saffron/25 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs uppercase tracking-[0.22em] text-on-chrome/70">
            Legal · version {CIVIC_POST_TERMS_VERSION}
          </p>
          <div className="mt-4">
            <BrandLogo size="lg" withWordmark onDark />
          </div>
          <h1 className="font-display mt-5 max-w-3xl text-3xl leading-tight text-on-chrome sm:text-4xl">
            {CIVIC_POST_TERMS_TITLE}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-chrome/85 sm:text-lg">
            Binding rules for every publication on Janark — a{" "}
            <span className="text-amber-bright">non-profit civic
            organisation</span>. Accepting these Terms is required before you
            post. They also make clear that{" "}
            <span className="text-amber-bright">Janark is not responsible for
            user-generated content</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a
              href="#summary"
              className="bg-amber px-4 py-2.5 font-semibold text-on-amber hover:bg-amber-bright"
            >
              Key points
            </a>
            <a
              href="#full-terms"
              className="border border-cream/40 px-4 py-2.5 text-on-chrome hover:border-amber hover:text-amber-bright"
            >
              Full terms
            </a>
            <a
              href="#faqs"
              className="border border-cream/40 px-4 py-2.5 text-on-chrome hover:border-amber hover:text-amber-bright"
            >
              FAQs
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              On this page
            </p>
            <nav className="mt-3 space-y-1 text-sm" aria-label="Terms sections">
              <a
                href="#summary"
                className="block py-1 text-navy hover:text-link"
              >
                Key points
              </a>
              <a
                href="#full-terms"
                className="block py-1 text-navy hover:text-link"
              >
                Full terms
              </a>
              {CIVIC_POST_TERMS_SECTIONS.map((s) => (
                <a
                  key={s.heading}
                  href={`#${sectionAnchor(s.heading)}`}
                  className="block truncate py-1 pl-3 text-muted hover:text-link"
                >
                  {s.heading}
                </a>
              ))}
              <a href="#faqs" className="block py-1 text-navy hover:text-link">
                FAQs
              </a>
              <a
                href="#contact"
                className="block py-1 text-navy hover:text-link"
              >
                Related links
              </a>
            </nav>
          </aside>

          <div className="min-w-0">
            <section id="summary" className="scroll-mt-24">
              <h2 className="font-display text-2xl text-navy sm:text-3xl">
                Key points
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                This summary helps you scan. The numbered Terms below are the
                binding text. If anything conflicts, the numbered Terms win.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {HIGHLIGHTS.map((h) => (
                  <div key={h.title} className="border-l-2 border-amber/50 pl-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-saffron">
                      {h.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-navy/90">
                      {h.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="full-terms" className="mt-14 scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h2 className="font-display text-2xl text-navy sm:text-3xl">
                    Full Terms & Conditions
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Version {CIVIC_POST_TERMS_VERSION} · Effective on acceptance
                    at publish time
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {CIVIC_POST_TERMS_SECTIONS.length} sections
                </p>
              </div>

              <div className="mt-8 space-y-10">
                {CIVIC_POST_TERMS_SECTIONS.map((section) => {
                  const id = sectionAnchor(section.heading);
                  return (
                    <article
                      key={section.heading}
                      id={id}
                      className="scroll-mt-24 border-l-2 border-amber/50 pl-4 sm:pl-5"
                    >
                      <h3 className="font-display text-xl text-navy sm:text-2xl">
                        {section.heading}
                      </h3>
                      {section.paragraphs.map((p) => (
                        <p
                          key={p.slice(0, 48)}
                          className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.95rem] sm:leading-7"
                        >
                          {p}
                        </p>
                      ))}
                      {section.bullets && section.bullets.length > 0 ? (
                        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
                          {section.bullets.map((b) => (
                            <li
                              key={b.slice(0, 48)}
                              className="flex gap-2.5"
                            >
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber"
                                aria-hidden
                              />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>

            <section id="faqs" className="mt-16 scroll-mt-24">
              <h2 className="font-display text-2xl text-navy sm:text-3xl">
                Frequently asked questions
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Plain-language answers. They explain the Terms — they do not
                replace them. If an FAQ conflicts with a numbered section, the
                numbered section controls.
              </p>
              <div className="mt-6">
                <TermsFaqList items={CIVIC_POST_TERMS_FAQS} />
              </div>
            </section>

            <section
              id="contact"
              className="mt-16 scroll-mt-24 border border-line bg-chrome p-6 text-on-chrome sm:p-8"
            >
              <h2 className="font-display text-2xl text-on-chrome">
                Before you publish
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-chrome/85">
                If you cannot accept these Terms — including non-partisan rules
                and platform non-liability — do not publish. Browsing remains
                open without acceptance.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Link
                  href={portalHref("/about")}
                  className="bg-amber px-4 py-2.5 font-semibold text-on-amber hover:bg-amber-bright"
                >
                  How anonymity works
                </Link>
                <Link
                  href="/"
                  className="border border-cream/40 px-4 py-2.5 text-on-chrome hover:border-amber hover:text-amber-bright"
                >
                  Back to home
                </Link>
                <Link
                  href={portalHref("/feed")}
                  className="border border-cream/40 px-4 py-2.5 text-on-chrome hover:border-amber hover:text-amber-bright"
                >
                  Open feed
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
