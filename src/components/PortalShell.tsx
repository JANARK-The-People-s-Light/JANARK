"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/AuthModal";
import { BrandLogo } from "@/components/BrandLogo";
import { IconMenu, IconX } from "@/components/Icons";
import { PortalRightPanel } from "@/components/PortalRightPanel";
import { clearPhoneSession } from "@/lib/client-id";
import {
  navIsActive,
  PORTAL_NAV,
  type NavItem,
} from "@/lib/portal-nav";
import { portalHref } from "@/lib/paths";

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const className = `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition duration-200 ${
    active
      ? "bg-sand text-navy"
      : "text-navy/80 hover:bg-sand/70 hover:text-navy"
  } ${item.soon ? "opacity-70" : ""}`;

  const inner = (
    <>
      <item.Icon
        className={`h-6 w-6 shrink-0 ${active ? "text-amber" : "text-navy/70 group-hover:text-navy"}`}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  if (item.soon) {
    return (
      <span className={className} title={`${item.label} (soon)`} aria-disabled>
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {inner}
    </Link>
  );
}

/**
 * X-style portal chrome: top header + sticky left nav + center + trends rail.
 */
export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, refreshSession, openLogin } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** Create pages — hide topics rail / mobile tabs */
  const composeFocus = useMemo(() => {
    const p = pathname.replace(/\/$/, "");
    return /\/(share|vote|issues|reports|petitions|feed|notice|memes)\/new$/.test(
      p,
    );
  }, [pathname]);

  /** Legal / long-read pages — no left nav or right rail */
  const documentFocus = useMemo(() => {
    const p = pathname.replace(/\/$/, "");
    return /\/terms$/.test(p);
  }, [pathname]);

  const hideLeftRail = documentFocus;
  const hideRightRail = composeFocus || documentFocus;
  const hideMobileTabs = composeFocus || documentFocus;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const navItems = useMemo(() => {
    return PORTAL_NAV.map((item) => {
      if (item.id === "profile" && session?.anonId) {
        return {
          ...item,
          href: portalHref(`/u/${session.anonId}`),
          soon: false,
          badge: undefined,
        };
      }
      return item;
    });
  }, [session?.anonId]);

  const mobileItems = useMemo(
    () => navItems.filter((i) => i.mobile),
    [navItems],
  );

  if (pathname === "/") {
    return <>{children}</>;
  }

  function logout() {
    void clearPhoneSession().then(() => {
      refreshSession();
      setDrawerOpen(false);
      router.refresh();
    });
  }

  const sidebarNav = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-2">
        <nav aria-label="Primary" className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              active={navIsActive(pathname, item)}
              onNavigate={() => setDrawerOpen(false)}
            />
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-line px-2 py-3">
        {session?.anonId ? (
          <Link
            href={portalHref(`/u/${session.anonId}`)}
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition duration-200 hover:bg-sand/70"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-semibold text-cream">
              {session.anonId.slice(3, 5).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-navy">
                Anon {session.anonId}
              </span>
              <span className="block truncate font-mono text-xs text-muted">
                {session.anonId}
              </span>
            </span>
          </Link>
        ) : (
          <p className="px-3 py-2 text-xs text-muted">
            Log in from the header to post and follow.
          </p>
        )}
      </div>
    </>
  );

  const drawer =
    mounted &&
    drawerOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-navy/50"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
        <aside className="absolute inset-y-0 left-0 flex w-[min(100%,18.5rem)] flex-col border-r border-line bg-cream pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl">
          <div className="flex items-center justify-end px-3 pt-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-navy hover:bg-sand"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
          {sidebarNav}
        </aside>
      </div>,
      document.body,
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global header — login / about / terms (dark navy theme) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1380px] items-center gap-3 px-3 sm:px-4 lg:px-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-cream hover:bg-white/10 lg:hidden"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <Link
            href={portalHref("/")}
            className="group shrink-0"
            aria-label="Janark home"
          >
            <BrandLogo
              size="sm"
              withWordmark
              onDark
              className="transition group-hover:opacity-90"
              priority
            />
          </Link>

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <Link
              href={portalHref("/about")}
              className="rounded-lg px-2.5 py-2 text-sm text-sand/90 transition hover:bg-white/10 hover:text-amber-bright"
            >
              About
            </Link>
            <Link
              href={portalHref("/terms")}
              className="rounded-lg px-2.5 py-2 text-sm text-sand/90 transition hover:bg-white/10 hover:text-amber-bright"
            >
              <span className="sm:hidden">Terms</span>
              <span className="hidden sm:inline">Terms &amp; Conditions</span>
            </Link>
            {session?.anonId ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href={portalHref(`/u/${session.anonId}`)}
                  className="max-w-[9rem] truncate rounded-lg px-2.5 py-2 font-mono text-xs text-amber-bright hover:bg-white/10 sm:text-sm"
                  title={session.anonId}
                >
                  {session.anonId}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg px-2.5 py-2 text-sm text-sand/70 transition hover:bg-white/10 hover:text-amber-bright"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openLogin({ reason: "use Janark" })}
                className="rounded-lg bg-amber px-3 py-2 text-sm font-semibold text-navy transition hover:bg-amber-bright"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        className={`mx-auto flex w-full ${
          documentFocus ? "max-w-none" : "max-w-[1380px]"
        }`}
      >
        {!hideLeftRail ? (
          <aside
            className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[280px] shrink-0 flex-col border-r border-line bg-cream/80 px-2 py-2 lg:flex"
            aria-label="Site navigation"
          >
            {sidebarNav}
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <main
            className={`min-w-0 flex-1 ${
              hideMobileTabs
                ? "pb-28 lg:pb-0"
                : "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
            }`}
          >
            {children}
          </main>
        </div>

        {!hideRightRail ? <PortalRightPanel /> : null}
      </div>

      {!hideMobileTabs ? (
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Mobile primary"
      >
        <ul className="mx-auto flex h-14 max-w-lg items-stretch justify-around">
          {mobileItems.map((item) => {
            const active = navIsActive(pathname, item);
            return (
              <li key={item.id} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${
                    active ? "text-amber" : "text-muted hover:text-navy"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <item.Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      ) : null}

      {drawer}
    </div>
  );
}
