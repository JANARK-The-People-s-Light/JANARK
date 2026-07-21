import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-navy sm:text-4xl">About Janark</h1>
      <p className="font-display mt-3 text-xl text-amber sm:text-2xl">
        The light of the people, for the people, by the people
      </p>
      <p className="mt-4 text-lg leading-relaxed text-navy/90">
        A non-profit civic organisation — an independent platform, not a
        government portal, not a party. Just a unified voice.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Non-profit</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Janark is operated as a{" "}
          <strong className="text-navy">non-profit organisation</strong>. Our
          purpose is public benefit: informed civic participation,
          accountability, and collective voice — not commercial profit from
          citizens, and not partisan gain.
        </p>
        <ul className="mt-4 space-y-3 text-muted leading-relaxed">
          <li>
            · Not a for-profit social network, ad marketplace, or data-sales
            business.
          </li>
          <li>
            · Independent of government and political parties — built for
            people, not official power or campaigns.
          </li>
          <li>
            · Open contribution (including open source) helps keep the mission
            transparent and people-owned.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">What Janark is</h2>
        <ul className="mt-4 space-y-3 text-muted leading-relaxed">
          <li>
            · A place for citizens to speak freely, vote freely, raise notice,
            and gather around public demands.
          </li>
          <li>
            · Independent of government and political parties — built for
            collective voice, not official power.
          </li>
          <li>
            · When enough people signal the same need, that will becomes
            visible public pressure.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Non-binding polls</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Every vote on Janark is{" "}
          <strong className="text-navy">non-binding public opinion</strong>.
          Support is tied to an anonymous phone verification (hash only — your
          number is never shown). Not an official election or government poll.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">How we present debate</h2>
        <ul className="mt-4 space-y-3 text-muted leading-relaxed">
          <li>· Multiple viewpoints by default — pros and cons on every issue.</li>
          <li>
            · Facts, news, and user opinions are labeled separately where
            possible.
          </li>
          <li>· Sources are listed so claims can be checked.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Moderation</h2>
        <p className="mt-4 leading-relaxed text-muted">
          We remove abuse, doxxing, targeted harassment, and illegal content —
          not dissent. Disagreement with government, parties, or majority
          opinion is allowed. Transparent rules will expand as the platform
          grows as the platform does.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">
          Browse free · login only to act
        </h2>
        <ul className="mt-4 space-y-3 text-muted leading-relaxed">
          <li>
            · You can <strong className="text-navy">read everything</strong>{" "}
            without logging in.
          </li>
          <li>
            · Phone OTP login appears only when you{" "}
            <strong className="text-navy">post or react</strong> (vote,
            support, comment, publish).
          </li>
          <li>
            · We keep <strong className="text-navy">complete anonymity</strong>
            : only a one-way hash of your number is stored; it is never shown.
            You get a public <strong className="text-navy">anonymity ID</strong>{" "}
            (like jn-a7k2m9xq) so others can visit your profile of posts and
            reactions — never your phone.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Vote integrity</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Votes and supports require phone verification. Numbers are never
          shown. We publish how votes are counted and harden against abuse as
          the platform scales.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-navy">Open source</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Janark is open source under the{" "}
          <strong className="text-navy">Apache License 2.0</strong>. Anyone can
          contribute — code, docs, design, bugs, or ideas — through our GitHub
          organization{" "}
          <a
            href="https://github.com/JANARK-The-People-s-Light"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:underline"
          >
            JANARK - The People&apos;s Light
          </a>
          .
        </p>
        <ul className="mt-4 space-y-3 text-muted leading-relaxed">
          <li>
            · Browse repositories, open issues, and submit pull requests at{" "}
            <a
              href="https://github.com/JANARK-The-People-s-Light"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:underline"
            >
              github.com/JANARK-The-People-s-Light
            </a>
            .
          </li>
          <li>
            · See <code className="text-navy">CONTRIBUTING.md</code>,{" "}
            <code className="text-navy">LICENSE</code>, and{" "}
            <code className="text-navy">NOTICE</code> in the repository for how
            to contribute under Apache 2.0.
          </li>
          <li>
            · Contributions help keep this non-profit platform independent,
            transparent, and owned by the people who use it.
          </li>
        </ul>
      </section>

      <p className="mt-12 text-sm text-muted">
        Ready to participate?{" "}
        <Link href="/feed" className="text-amber hover:underline">
          Open the feed
        </Link>{" "}
        or{" "}
        <a
          href="https://github.com/JANARK-The-People-s-Light"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber hover:underline"
        >
          contribute on GitHub
        </a>
        .
      </p>
    </div>
  );
}
