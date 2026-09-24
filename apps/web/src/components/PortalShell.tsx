"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/AuthModal";
import { BrandLogo } from "@/components/BrandLogo";
import { IconMenu, IconX } from "@/components/Icons";
import { PortalRightPanel } from "@/components/PortalRightPanel";
import { PortalHeaderSearch } from "@/components/PortalHeaderSearch";
import { WhoToFollow } from "@/components/WhoToFollow";
import { clearPhoneSession } from "@/lib/client-id";
import { fill, rules, sys, templates, isPublicMarketingPath } from "@/lib/config";
import {
  groupedPortalNav,
  getPortalNav,
  navIsActive,
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
  const className = `group flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition duration-150 ${
    active
      ? "bg-sand text-navy"
      : "text-navy/75 hover:bg-sand/60 hover:text-navy"
  } ${item.soon ? "opacity-70" : ""}`;

  const inner = (
    <>
      <item.Icon
        className={`h-5 w-5 shrink-0 ${active ? "text-link" : "text-navy/55 group-hover:text-navy"}`}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-md bg-sand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
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
 * Portal chrome: fixed header + left nav + scrollable center + trends rail.
 * Left/right stay put; only the middle column scrolls.
 * Layout metrics / copy / rail rules come from repo-root `config/`.
 */
export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const router = useRouter();
  const { session, refreshSession, openLogin } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const layout = sys.portal();
  const portalRules = rules.portal();
  const copy = templates.portal();
  const brand = templates.brand();

  const composeFocus = useMemo(() => {
    if (!portalRules.hideRightRailOnCompose) return false;
    const p = pathname.replace(/\/$/, "");
    return new RegExp(portalRules.composePathPattern).test(p);
  }, [pathname, portalRules]);

  const documentFocus = useMemo(() => {
    if (!portalRules.hideRailsOnDocumentFocus) return false;
    const p = pathname.replace(/\/$/, "");
    return new RegExp(portalRules.documentFocusPathPattern).test(p);
  }, [pathname, portalRules]);

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
    return getPortalNav().map((item) => {
      if (item.id === "profile" && mounted && session?.anonId) {
        return {
          ...item,
          href: portalHref(`/u/${session.anonId}`),
          soon: false,
          badge: undefined,
        };
      }
      return item;
    });
  }, [session, mounted]);

  const mobileItems = useMemo(
    () => navItems.filter((i) => i.mobile),
    [navItems],
  );

  const navGroups = useMemo(() => groupedPortalNav(navItems), [navItems]);

  if (isPublicMarketingPath(pathname)) {
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-3">
        <nav aria-label={copy.navAriaLabel} className="flex flex-col gap-5">
          {navGroups.map((g) => (
            <div key={g.group}>
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                {g.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {g.items.map((item) => (
                  <NavLink
                    key={item.id}
                    item={item}
                    active={navIsActive(pathname, item, search)}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <WhoToFollow onNavigate={() => setDrawerOpen(false)} />
      </div>

      <div className="shrink-0 border-t border-line/80 px-3 py-3">
        {!mounted ? (
          <p className="text-[11px] leading-relaxed text-muted" aria-hidden>
            {copy.loginHint}
          </p>
        ) : session?.anonId ? (
          <p className="truncate font-mono text-[11px] text-muted">
            {fill(copy.signedInAs, { anonId: session.anonId })}
          </p>
        ) : (
          <p className="text-[11px] leading-relaxed text-muted">
            {copy.loginHint}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <Link
            href={sys.paths().landingHome}
            onClick={() => setDrawerOpen(false)}
            className="font-medium text-link hover:underline"
          >
            {copy.backToLanding}
          </Link>
          <Link
            href={portalHref("/about")}
            onClick={() => setDrawerOpen(false)}
            className="text-link hover:underline"
          >
            {copy.about}
          </Link>
          <Link
            href={portalHref("/terms")}
            onClick={() => setDrawerOpen(false)}
            className="text-link hover:underline"
          >
            {copy.termsShort}
          </Link>
          <Link
            href={portalHref("/settings")}
            onClick={() => setDrawerOpen(false)}
            className="text-link hover:underline"
          >
            {copy.settings}
          </Link>
        </div>
      </div>
    </>
  );

  const drawer =
    mounted &&
    drawerOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] xl:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={copy.drawerAriaLabel}
      >
        <button
          type="button"
          className="absolute inset-0 bg-chrome/50"
          aria-label={copy.closeMenuAriaLabel}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className="absolute inset-y-0 left-0 flex w-[min(100%,var(--portal-drawer-max))] flex-col border-r border-line bg-cream pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl"
            style={
              {
                ["--portal-drawer-max" as string]: `${layout.drawerMaxWidthRem}rem`,
              } as CSSProperties
            }
        >
          <div className="flex items-center justify-end px-3 pt-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-navy hover:bg-sand"
              aria-label={copy.closeMenuAriaLabel}
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
    <div
      className="flex flex-col overflow-hidden bg-background text-foreground"
      style={{ height: layout.shellHeight }}
    >
      <header className="z-50 shrink-0 border-b border-white/10 bg-chrome/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <div
          className="mx-auto flex items-center gap-3 px-3 sm:px-4 lg:px-3"
          style={{
            height: `${layout.headerHeightRem}rem`,
            maxWidth: documentFocus ? undefined : layout.maxWidthPx,
          }}
        >
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-on-chrome hover:bg-white/10 xl:hidden"
            aria-label={copy.openMenuAriaLabel}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <Link
            href={portalHref("/")}
            className="group min-w-0 shrink"
            aria-label={copy.homeAriaLabel}
          >
            <BrandLogo
              size="sm"
              withWordmark
              wordmarkClassName="hidden lg:inline"
              onDark
              className="transition group-hover:opacity-90 [&_span.font-display]:text-lg sm:[&_span.font-display]:text-xl"
              priority
            />
          </Link>

          <PortalHeaderSearch />

          <div className="ml-auto flex min-w-0 shrink items-center gap-0.5 sm:gap-2">
            <Link
              href={sys.paths().landingHome}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/20 px-2 py-1.5 text-xs font-medium text-on-chrome/90 transition hover:border-amber-bright/40 hover:bg-white/10 hover:text-amber-bright sm:px-2.5 sm:text-sm"
              aria-label={fill(copy.backToLandingAriaLabel, { name: brand.name })}
            >
              <span className="lg:hidden">{copy.backToLandingShort}</span>
              <span className="hidden lg:inline">{copy.backToLanding}</span>
            </Link>
            <Link
              href={portalHref("/about")}
              className="inline-flex shrink-0 items-center justify-center rounded-lg px-2 py-2 text-sm text-on-chrome/90 transition hover:bg-white/10 hover:text-amber-bright sm:px-2.5"
              aria-label={copy.about}
            >
              <span className="lg:hidden">{copy.aboutShort}</span>
              <span className="hidden lg:inline">{copy.about}</span>
            </Link>
            <Link
              href={portalHref("/terms")}
              className="inline-flex shrink-0 items-center justify-center rounded-lg px-2 py-2 text-sm text-on-chrome/90 transition hover:bg-white/10 hover:text-amber-bright sm:px-2.5"
              aria-label={copy.termsLong}
            >
              <span className="lg:hidden">{copy.termsAbbrev}</span>
              <span className="hidden lg:inline">{copy.termsLong}</span>
            </Link>
            {/* Auth chrome only after mount — avoids SSR/client session mismatch */}
            {!mounted ? (
              <span
                className="inline-block h-9 w-[4.5rem] shrink-0 rounded-lg bg-white/10"
                aria-hidden
              />
            ) : session?.anonId ? (
              <div className="flex min-w-0 items-center gap-0.5 sm:gap-2">
                <Link
                  href={portalHref(`/u/${session.anonId}`)}
                  className="max-w-[6.5rem] truncate rounded-lg px-2 py-2 font-mono text-xs text-amber-bright hover:bg-white/10 sm:max-w-[9rem] sm:px-2.5 sm:text-sm"
                  title={session.anonId}
                >
                  {session.anonId}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="shrink-0 rounded-lg px-2 py-2 text-sm text-on-chrome/70 transition hover:bg-white/10 hover:text-amber-bright sm:px-2.5"
                >
                  {copy.logOut}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  openLogin({
                    reason: fill(copy.loginReason, { name: brand.name }),
                  })
                }
                className="shrink-0 rounded-lg bg-amber px-2.5 py-2 text-sm font-semibold text-on-amber transition hover:bg-amber-bright sm:px-3"
              >
                {copy.logIn}
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        className="mx-auto flex min-h-0 w-full flex-1 overflow-hidden"
        style={{ maxWidth: documentFocus ? undefined : layout.maxWidthPx }}
      >
        {!hideLeftRail ? (
          <aside
            className="hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-line bg-cream/80 px-2 py-2 xl:flex"
            style={{ width: layout.leftRailWidthPx }}
            aria-label={copy.siteNavAriaLabel}
          >
            {sidebarNav}
          </aside>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip overflow-y-auto overscroll-y-contain">
          <main
            className={`min-w-0 flex-1 ${
              hideMobileTabs
                ? "pb-28 xl:pb-0"
                : "pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] xl:pb-0"
            }`}
          >
            {children}
          </main>
        </div>

        {!hideRightRail ? <PortalRightPanel /> : null}
      </div>

      {!hideMobileTabs ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 backdrop-blur xl:hidden pb-[env(safe-area-inset-bottom,0px)]"
          aria-label={copy.mobileNavAriaLabel}
        >
          <ul
            className="mx-auto flex max-w-lg items-stretch justify-around"
            style={{ height: `${layout.mobileNavHeightRem}rem` }}
          >
            {mobileItems.map((item) => {
              const active = navIsActive(pathname, item, search);
              return (
                <li key={item.id} className="flex-1">
                  <Link
                    href={item.href}
                    className={`flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${
                      active ? "text-link" : "text-muted hover:text-navy"
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

