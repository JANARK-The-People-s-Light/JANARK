"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { clearPhoneSession } from "@/lib/client-id";
import { useAuth } from "@/components/AuthModal";
import { BrandLogo } from "@/components/BrandLogo";
import { PORTAL_BASE, portalHref } from "@/lib/paths";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/memes", label: "Memes" },
  { href: "/demands", label: "Demands" },
  { href: "/reports", label: "Reports" },
  { href: "/feed", label: "Feed" },
  { href: "/issues", label: "Issues" },
  { href: "/vote/new", label: "Vote" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
].map((l) => ({ ...l, href: portalHref(l.href) }));

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, refreshSession } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Public coming-soon page has its own full-bleed layout
  if (pathname === "/") {
    return null;
  }

  function logout() {
    void clearPhoneSession().then(() => {
      refreshSession();
      setMenuOpen(false);
      router.refresh();
    });
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const mobileMenu =
    mounted &&
    menuOpen &&
    createPortal(
      <div
        id="mobile-nav"
        className="fixed inset-0 z-[100] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <button
          type="button"
          className="absolute inset-0 bg-navy/70"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
        <div className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-navy pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <BrandLogo size="sm" withWordmark onDark priority={false} />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center text-cream"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <ul className="flex flex-col p-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-3.5 text-base ${
                      isActive(link.href)
                        ? "bg-white/10 text-amber-bright"
                        : "text-sand active:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-white/10 p-4">
              {session ? (
                <div className="space-y-3">
                  {session.anonId ? (
                    <Link
                      href={portalHref(`/u/${session.anonId}`)}
                      onClick={() => setMenuOpen(false)}
                      className="block break-all font-mono text-sm text-amber-bright"
                    >
                      Profile · {session.anonId}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full border border-cream/30 px-4 py-3 text-sm text-cream"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-sand/60">
                  Browse freely. Login appears only when you post or react.
                </p>
              )}
            </div>
          </nav>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={PORTAL_BASE}
            className="group shrink-0"
            onClick={() => setMenuOpen(false)}
            aria-label="Janark portal home"
          >
            <BrandLogo
              size="sm"
              withWordmark
              onDark
              className="transition group-hover:opacity-90"
              priority
            />
          </Link>

          <nav
            className="hidden items-center justify-end gap-x-4 text-sm text-sand/90 lg:flex"
            aria-label="Primary"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive(link.href)
                    ? "text-amber-bright"
                    : "transition hover:text-amber-bright"
                }
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <span className="flex items-center gap-2 text-xs text-sand/70">
                {session.anonId ? (
                  <Link
                    href={portalHref(`/u/${session.anonId}`)}
                    className="max-w-[9rem] truncate font-mono text-amber-bright hover:underline"
                    title="Your anonymous profile"
                  >
                    {session.anonId}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={logout}
                  className="text-amber-bright hover:underline"
                >
                  Log out
                </button>
              </span>
            ) : null}
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            {session?.anonId ? (
              <Link
                href={portalHref(`/u/${session.anonId}`)}
                className="max-w-[5.5rem] truncate font-mono text-[11px] text-amber-bright"
                title="Your profile"
              >
                {session.anonId}
              </Link>
            ) : null}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center border border-cream/25 text-cream"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="sr-only">{menuOpen ? "Close" : "Menu"}</span>
              <span aria-hidden className="relative block h-3.5 w-5">
                <span
                  className={`absolute left-0 block h-0.5 w-5 bg-cream transition ${
                    menuOpen ? "top-[6px] rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-[6px] block h-0.5 w-5 bg-cream transition ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-0.5 w-5 bg-cream transition ${
                    menuOpen ? "top-[6px] -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
        <div
          className="border-t border-amber/25 bg-amber text-center text-navy"
          role="status"
        >
          <p className="px-4 py-2 text-xs font-semibold tracking-wide sm:text-sm">
            Coming soon ·{" "}
            <time dateTime="2026-08-15">15 August 2026</time>
            <span className="font-normal">
              {" "}
              · for the people, by the people · so feel free to contribute here
              —{" "}
              <a
                href="https://github.com/JANARK-The-People-s-Light/JANARK"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-navy/80"
              >
                GitHub
              </a>
            </span>
          </p>
        </div>
        {mobileMenu}
      </header>
      <div
        className="shrink-0 pt-[env(safe-area-inset-top,0px)]"
        aria-hidden
      >
        <div className="h-14" />
        <div className="h-12 sm:h-10" />
      </div>
    </>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-line bg-navy text-sand pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-6">
        <div className="min-w-0">
          <BrandLogo size="md" withWordmark onDark />
          <p className="mt-2 font-display text-sm leading-snug text-amber-bright/90">
            for the people, by the people
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-sand/70">
            A non-profit civic organisation — independent of government and
            parties. Just a unified voice.
          </p>
          <p className="mt-3 text-xs text-sand/40">
            Coming soon · public launch{" "}
            <time dateTime="2026-08-15">15 August 2026</time>
            {" · "}
            <Link href="/" className="text-amber-bright/70 hover:underline">
              Launch page
            </Link>
          </p>
        </div>
        <div className="shrink-0 space-y-2 text-xs leading-relaxed text-sand/50 sm:max-w-[14rem] sm:text-right">
          <p>
            Browse freely · login only to post or react · anonymity ID profiles
          </p>
          <p>
            <Link
              href={portalHref("/terms")}
              className="text-amber-bright/80 hover:underline"
            >
              Civic Posting Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
