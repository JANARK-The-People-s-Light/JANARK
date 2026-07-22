import type { Metadata } from "next";
import Link from "next/link";
import { portalHref } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "About",
  description:
    "Janark is an independent, non-profit civic platform for public discussion, petitions, reports, and community voting.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-navy sm:text-4xl">
        About Janark
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-navy/90">
        Janark is an independent, non-profit civic platform for public
        discussion, petitions, reports, and community voting.
      </p>
      <p className="mt-4 leading-relaxed text-muted">
        Read freely. Participate when you choose. Every report, petition,
        discussion, vote, and contribution shapes what Janark becomes.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Participate your way</h2>
        <ul className="mt-4 space-y-3 leading-relaxed text-muted">
          <li>· Browse freely without signing in.</li>
          <li>
            · Verify once by phone when you choose to post, support, vote, or
            comment.
          </li>
          <li>
            · Stay anonymous with a public Janark ID — your phone number is
            never shown.
          </li>
          <li>· Support ideas, not personalities.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">What matters</h2>
        <ul className="mt-4 space-y-3 leading-relaxed text-muted">
          <li>· Independent of governments and political parties.</li>
          <li>· Community supported and open source.</li>
          <li>· Public opinion, not official elections.</li>
          <li>· Transparent moderation and vote integrity.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Contribute</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Janark is built in the open. Report bugs, suggest ideas, or contribute
          code on GitHub. The JANARK name and logo are reserved; commercial use
          and public hosting need written permission.
        </p>
        <p className="mt-4">
          <a
            href="https://github.com/JANARK-The-People-s-Light"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:underline"
          >
            github.com/JANARK-The-People-s-Light
          </a>
        </p>
      </section>

      <p className="mt-14 text-sm text-muted">
        <Link href={portalHref("/")} className="text-amber hover:underline">
          Open the portal
        </Link>
      </p>
    </div>
  );
}
