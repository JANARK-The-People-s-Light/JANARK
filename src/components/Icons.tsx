/** Lightweight inline SVG icons — no icon package dependency. */

import type { ReactNode } from "react";

type IconProps = {
  className?: string;
  title?: string;
};

const base = "h-4 w-4 shrink-0";

function Svg({
  className = base,
  children,
  title,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconUp({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </Svg>
  );
}

export function IconDown({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </Svg>
  );
}

export function IconComment({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export function IconShare({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </Svg>
  );
}

export function IconFlag({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </Svg>
  );
}

export function IconFilter({ className }: IconProps) {
  return (
    <Svg className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </Svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

export function IconGif({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9v6" />
      <path d="M7 12h3" />
      <path d="M14 9h3v6h-3" />
      <path d="M14 12h2" />
    </Svg>
  );
}

export function IconAttach({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 01-7.78-7.78l8.49-8.49a3.5 3.5 0 014.95 4.95l-8.5 8.49a1.5 1.5 0 01-2.12-2.12l7.78-7.78" />
    </Svg>
  );
}

export function IconReply({ className }: IconProps) {
  return (
    <Svg className={className}>
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </Svg>
  );
}

export function IconCopy({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  );
}

export function IconLink({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

export function IconDeviceShare({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </Svg>
  );
}

/** Brand-ish marks for share destinations */
export function IconWhatsApp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? base} aria-hidden fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.2-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.5-1-.9-1.5-1.9-1.7-2.2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1s.9 2.4 1.1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.8 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.3z" />
      <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20z" />
    </svg>
  );
}

export function IconFacebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? base} aria-hidden fill="currentColor">
      <path d="M14 8h2.5V4.5H14c-2.2 0-3.5 1.5-3.5 3.7V10H8v3.5h2.5V20H14v-6.5h2.3L17 10h-3V8.4c0-.5.2-.8.8-.8z" />
    </svg>
  );
}

export function IconLinkedIn({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? base} aria-hidden fill="currentColor">
      <path d="M6.5 9.5H3.7V20h2.8V9.5zM5.1 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM20.3 20h-2.8v-5.6c0-1.5-.6-2.5-2-2.5-1.1 0-1.7.7-2 1.4-.1.2-.1.6-.1.9V20h-2.8s0-9.2 0-10.5h2.8v1.7c.5-.8 1.5-2 3.6-2 2.5 0 4.3 1.6 4.3 5.1V20z" />
    </svg>
  );
}

export function IconXTwitter({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? base} aria-hidden fill="currentColor">
      <path d="M17.3 4h2.4l-5.3 6.1L21 20h-5.5l-4.3-5.6L6.3 20H3.9l5.7-6.5L3 4h5.6l3.9 5.1L17.3 4zm-.8 14.4h1.3L7.6 5.5H6.2l10.3 12.9z" />
    </svg>
  );
}

export function IconInstagram({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

const iconBtn =
  "inline-flex items-center justify-center gap-0.5 rounded-sm p-1.5 text-sm transition disabled:opacity-60";

export function iconBtnClass(active?: boolean, danger?: boolean) {
  if (danger && active) {
    return `${iconBtn} text-danger`;
  }
  if (active) {
    return `${iconBtn} text-amber`;
  }
  return `${iconBtn} text-navy/70 hover:text-navy`;
}
