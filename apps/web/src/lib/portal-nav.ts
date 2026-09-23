import type { ComponentType } from "react";
import {
  IconBallot,
  IconChat,
  IconFileText,
  IconFlame,
  IconHome,
  IconMapPin,
  IconMegaphone,
  IconSettings,
  IconUser,
} from "@/components/Icons";
import { templates } from "@/lib/config";
import { PORTAL_BASE, portalHref } from "@/lib/paths";

export type NavIcon = ComponentType<{ className?: string }>;

export type NavGroup = "discover" | "act" | "you";

export type NavItem = {
  id: string;
  href: string;
  label: string;
  Icon: NavIcon;
  group: NavGroup;
  /** Match path prefix for active state */
  match?: string;
  badge?: string;
  soon?: boolean;
  /** Primary mobile bottom nav */
  mobile?: boolean;
};

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  discover: "Discover",
  act: "Act",
  you: "You",
};

export const NAV_GROUP_ORDER: NavGroup[] = ["discover", "act", "you"];

/**
 * Primary portal nav — grouped for progressive disclosure.
 * Unfinished items stay hidden until they ship.
 */
export function getPortalNav(): NavItem[] {
  const pulseLabel = templates.portal().pulseNav;
  return [
    {
      id: "home",
      href: portalHref("/"),
      label: "Home",
      Icon: IconHome,
      group: "discover",
      match: PORTAL_BASE,
      mobile: true,
    },
    {
      id: "pulse",
      href: portalHref("/dashboard"),
      label: pulseLabel,
      Icon: IconMapPin,
      group: "discover",
      match: portalHref("/dashboard"),
      mobile: true,
    },
    {
      id: "issues",
      href: portalHref("/issues"),
      label: "Issues",
      Icon: IconFlame,
      group: "act",
      match: portalHref("/issues"),
    },
    {
      id: "petitions",
      href: portalHref("/petitions"),
      label: "Petitions",
      Icon: IconMegaphone,
      group: "act",
      match: portalHref("/petitions"),
      mobile: true,
    },
    {
      id: "reports",
      href: portalHref("/reports"),
      label: "Reports",
      Icon: IconFileText,
      group: "act",
      match: portalHref("/reports"),
    },
    {
      id: "votes",
      href: portalHref("/vote"),
      label: "Votes",
      Icon: IconBallot,
      group: "act",
      match: portalHref("/vote"),
    },
    {
      id: "discussions",
      href: portalHref("/feed"),
      label: "Discussions",
      Icon: IconChat,
      group: "act",
      match: portalHref("/feed"),
    },
    {
      id: "notices",
      href: portalHref("/notice"),
      label: "Notices",
      Icon: IconMegaphone,
      group: "act",
      match: portalHref("/notice"),
    },
    {
      id: "profile",
      href: portalHref("/login"),
      label: "Profile",
      Icon: IconUser,
      group: "you",
      match: portalHref("/u"),
      mobile: true,
    },
    {
      id: "settings",
      href: portalHref("/settings"),
      label: "Settings",
      Icon: IconSettings,
      group: "you",
      match: portalHref("/settings"),
    },
  ];
}

/** @deprecated Prefer getPortalNav() so labels stay config-driven. */
export const PORTAL_NAV: NavItem[] = getPortalNav();

export function navIsActive(
  pathname: string,
  item: NavItem,
  _search = "",
): boolean {
  const isPortalHome =
    pathname === PORTAL_BASE ||
    pathname === `${PORTAL_BASE}/` ||
    pathname === "/";

  if (item.id === "home") {
    return isPortalHome;
  }

  const base = item.match ?? item.href.split("?")[0]!;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Grouped nav for side rail / drawer (not mobile tabs). */
export function groupedPortalNav(items: NavItem[] = getPortalNav()) {
  return NAV_GROUP_ORDER.map((group) => ({
    group,
    label: NAV_GROUP_LABELS[group],
    items: items.filter((i) => i.group === group),
  })).filter((g) => g.items.length > 0);
}
