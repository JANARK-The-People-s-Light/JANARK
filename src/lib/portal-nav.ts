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
import { PORTAL_BASE, portalHref } from "@/lib/paths";

export type NavIcon = ComponentType<{ className?: string }>;

export type NavItem = {
  id: string;
  href: string;
  label: string;
  Icon: NavIcon;
  /** Match path prefix for active state */
  match?: string;
  badge?: string;
  soon?: boolean;
  /** Primary mobile bottom nav */
  mobile?: boolean;
};

/**
 * Primary portal nav — unfinished items stay hidden until they ship.
 */
export const PORTAL_NAV: NavItem[] = [
  {
    id: "home",
    href: portalHref("/"),
    label: "Home",
    Icon: IconHome,
    match: PORTAL_BASE,
    mobile: true,
  },
  {
    id: "issues",
    href: portalHref("/issues"),
    label: "Issues",
    Icon: IconFlame,
    match: portalHref("/issues"),
  },
  {
    id: "petitions",
    href: portalHref("/petitions"),
    label: "Petitions",
    Icon: IconMegaphone,
    match: portalHref("/petitions"),
    mobile: true,
  },
  {
    id: "reports",
    href: portalHref("/reports"),
    label: "Reports",
    Icon: IconFileText,
    match: portalHref("/reports"),
  },
  {
    id: "votes",
    href: portalHref("/vote"),
    label: "Votes",
    Icon: IconBallot,
    match: portalHref("/vote"),
  },
  {
    id: "discussions",
    href: portalHref("/feed"),
    label: "Discussions",
    Icon: IconChat,
    match: portalHref("/feed"),
  },
  {
    id: "dashboard",
    href: portalHref("/dashboard"),
    label: "Activity",
    Icon: IconMapPin,
    match: portalHref("/dashboard"),
    mobile: true,
  },
  {
    id: "profile",
    href: portalHref("/login"),
    label: "Profile",
    Icon: IconUser,
    match: portalHref("/u"),
    mobile: true,
  },
  {
    id: "settings",
    href: portalHref("/settings"),
    label: "Settings",
    Icon: IconSettings,
    match: portalHref("/settings"),
  },
];

export function navIsActive(pathname: string, item: NavItem): boolean {
  if (item.id === "home") {
    return (
      pathname === PORTAL_BASE ||
      pathname === `${PORTAL_BASE}/` ||
      pathname === "/"
    );
  }
  const base = item.match ?? item.href.split("?")[0]!;
  return pathname === base || pathname.startsWith(`${base}/`);
}
