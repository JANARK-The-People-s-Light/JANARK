import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { portalHref } from "@/lib/paths";

type Props = Omit<LinkProps, "href"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    href: string;
    children?: ReactNode;
  };

/** Next Link that always targets the `/unreleased` portal when href is internal. */
export function PortalLink({ href, ...rest }: Props) {
  return <Link href={portalHref(href)} {...rest} />;
}
