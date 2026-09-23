"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { useAuth } from "@/components/AuthModal";
import { usePreferences } from "@/components/PreferencesProvider";
import { ThemePicker } from "@/components/ThemePicker";
import { clearPhoneSession } from "@/lib/client-id";
import { templates } from "@/lib/config";
import { portalHref } from "@/lib/paths";
import {
  LANGUAGE_OPTIONS,
  type FeedSortPref,
  type FontScalePref,
  type LanguagePref,
} from "@/lib/user-preferences";

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line pt-8">
      <h2 className="font-display text-xl text-navy">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white px-3 py-3 transition hover:bg-sand/30">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-navy">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            {description}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--amber)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function SelectRow({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-3">
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-navy">{label}</p>
          {description ? (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          ) : null}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 w-full max-w-full rounded-lg border border-line bg-background px-3 text-sm text-navy"
          aria-label={label}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const NAV = [
  { id: "appearance", label: "Appearance" },
  { id: "feed", label: "Feed & content" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & safety" },
  { id: "accessibility", label: "Accessibility" },
  { id: "language", label: "Language" },
  { id: "account", label: "Account" },
  { id: "data", label: "Data & about" },
] as const;

/**
 * Full settings hub for the Janark civic portal.
 * Requires login; values persist per anonymity ID on the server.
 */
export function SettingsClient() {
  const { session, refreshSession, openLogin } = useAuth();
  const { prefs, updatePrefs, resetPrefs, loading, canEdit } = usePreferences();
  const router = useRouter();

  function logout() {
    void clearPhoneSession().then(() => {
      refreshSession();
      router.push(portalHref("/"));
    });
  }

  function clearLocalDrafts() {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes("draft") || k.startsWith("janark-share"))) {
          keys.push(k);
        }
      }
      keys.forEach((k) => localStorage.removeItem(k));
      alert("Local drafts cleared on this device.");
    } catch {
      alert("Could not clear drafts.");
    }
  }

  if (!session?.anonId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-wider text-muted">You</p>
        <h1 className="font-display mt-1 text-3xl text-navy">Settings</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Log in with your phone to manage appearance, feed, notifications,
          privacy, and account. Preferences are saved to your anonymous Janark
          ID — not shared across other accounts on this device.
        </p>
        <button
          type="button"
          onClick={() => openLogin({ reason: "manage settings" })}
          className="mt-8 w-full rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-on-amber hover:bg-amber-bright sm:w-auto sm:px-8"
        >
          Log in with phone
        </button>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href={portalHref("/about")} className="text-link hover:underline">
            About Janark
          </Link>
          <Link href={portalHref("/terms")} className="text-link hover:underline">
            Terms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">You</p>
      <h1 className="font-display mt-1 text-3xl text-navy">Settings</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Appearance, feed, notifications, privacy, and account — saved to{" "}
        <span className="font-mono text-link">{session.anonId}</span>. They
        follow you on any device when you log in with the same phone.
      </p>
      {loading ? (
        <p className="mt-2 text-xs text-muted">Loading your settings…</p>
      ) : null}

      <nav
        aria-label="Settings sections"
        className="-mx-4 mt-6 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {NAV.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy hover:border-amber hover:text-link"
          >
            {n.label}
          </a>
        ))}
        <span className="w-4 shrink-0 sm:hidden" aria-hidden />
      </nav>

      <Section
        id="appearance"
        title="Appearance"
        hint="Theme, colors, and fonts for reading and posting."
      >
        <p className="mb-3 text-sm text-muted">
          Colors and fonts switch together. Saved to your account.
        </p>
        <ThemePicker />
      </Section>

      <Section
        id="feed"
        title="Feed & content"
        hint="Control what you see first in Community Feed."
      >
        <SelectRow
          label="Default home sort"
          description="How Community Feed opens for you."
          value={prefs.feedSort}
          options={[
            { value: "trending", label: "Civic trend (default)" },
            { value: "momentum", label: "Momentum" },
            { value: "new", label: "Newest first" },
            { value: "hot", label: "Hot / rising" },
          ]}
          onChange={(v) => updatePrefs({ feedSort: v as FeedSortPref })}
        />
        <ToggleRow
          label="Show community shares in All"
          description="Turn off to focus Home on issues, petitions, and reports."
          checked={prefs.showSharesInFeed}
          onChange={(v) => updatePrefs({ showSharesInFeed: v })}
        />
        <ToggleRow
          label="Blur sensitive report media"
          description="Similar to sensitive-content controls — preview before opening."
          checked={prefs.blurSensitiveMedia}
          onChange={(v) => updatePrefs({ blurSensitiveMedia: v })}
        />
        <ToggleRow
          label={templates.portal().pulseChronologicalLabel}
          description={templates.portal().pulseChronologicalHint}
          checked={prefs.activityChronological}
          onChange={(v) => updatePrefs({ activityChronological: v })}
        />
      </Section>

      <Section
        id="notifications"
        title="Notifications"
        hint="Choose which updates you want when delivery ships."
      >
        <ToggleRow
          label="Replies to my posts & comments"
          checked={prefs.notifyReplies}
          onChange={(v) => updatePrefs({ notifyReplies: v })}
        />
        <ToggleRow
          label="New followers"
          checked={prefs.notifyFollows}
          onChange={(v) => updatePrefs({ notifyFollows: v })}
        />
        <ToggleRow
          label="Mentions & tags"
          checked={prefs.notifyMentions}
          onChange={(v) => updatePrefs({ notifyMentions: v })}
        />
        <ToggleRow
          label="Weekly civic digest"
          description="Summary of nearby activity (email/SMS when delivery ships)."
          checked={prefs.notifyWeeklyDigest}
          onChange={(v) => updatePrefs({ notifyWeeklyDigest: v })}
        />
      </Section>

      <Section
        id="privacy"
        title="Privacy & safety"
        hint="Keep your phone private — only your anonymity ID is public."
      >
        <ToggleRow
          label="Allow profile discovery"
          description="When off, author profile links are disabled while you’re logged in on this device."
          checked={prefs.allowProfileDiscovery}
          onChange={(v) => updatePrefs({ allowProfileDiscovery: v })}
        />
        <ToggleRow
          label="Show “active recently” hint"
          description="Shows a private online hint on your own profile. Off by default — Janark stays low-signal."
          checked={prefs.showOnlineHint}
          onChange={(v) => updatePrefs({ showOnlineHint: v })}
        />
        <div className="rounded-xl border border-line bg-white px-3 py-3 text-sm text-muted">
          <p className="font-medium text-navy">Blocked & muted accounts</p>
          <p className="mt-1 text-xs leading-relaxed">
            Mute and block lists will appear here. For now, use Report on content
            that breaks civic terms.
          </p>
          <Link
            href={portalHref("/terms")}
            className="mt-2 inline-block text-xs text-link hover:underline"
          >
            Civic posting terms →
          </Link>
        </div>
      </Section>

      <Section
        id="accessibility"
        title="Accessibility"
        hint="Text size and motion for comfortable reading."
      >
        <SelectRow
          label="Text size"
          value={prefs.fontScale}
          options={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Default" },
            { value: "lg", label: "Large" },
          ]}
          onChange={(v) => updatePrefs({ fontScale: v as FontScalePref })}
        />
        <ToggleRow
          label="Reduce motion"
          description="Minimize animations and transitions."
          checked={prefs.reduceMotion}
          onChange={(v) => updatePrefs({ reduceMotion: v })}
        />
      </Section>

      <Section
        id="language"
        title="Language & region"
        hint="Interface language preference for your account."
      >
        <SelectRow
          label="App language"
          description="English is available now. All other languages are coming. Post language stays as written by citizens."
          value={prefs.language}
          options={LANGUAGE_OPTIONS}
          onChange={(v) => updatePrefs({ language: v as LanguagePref })}
        />
      </Section>

      <Section
        id="account"
        title="Account"
        hint="Your anonymous phone session and public anonymity ID."
      >
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-muted">
            Anonymity ID
          </p>
          <p className="mt-1 font-mono text-link">{session.anonId}</p>
          <p className="mt-2 text-xs text-muted">
            Your phone number is never shown. Only this public ID appears on
            posts. Settings above are tied to this ID.
          </p>
          <Link
            href={portalHref(`/u/${session.anonId}`)}
            className="mt-2 inline-block text-sm text-link hover:underline"
          >
            View profile →
          </Link>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy hover:border-danger hover:text-danger"
        >
          Log out
        </button>
      </Section>

      <Section
        id="data"
        title="Data & about"
        hint="Clear drafts, reset preferences, and read Janark policies."
      >
        <button
          type="button"
          onClick={clearLocalDrafts}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-left text-sm font-medium text-navy hover:bg-sand/40"
        >
          Clear local drafts
          <span className="mt-0.5 block text-xs font-normal text-muted">
            Removes unfinished composers saved in this browser.
          </span>
        </button>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            if (
              confirm(
                "Reset feed, notification, and accessibility preferences for your account?",
              )
            ) {
              resetPrefs();
            }
          }}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-left text-sm font-medium text-navy hover:bg-sand/40 disabled:opacity-50"
        >
          Reset preferences
          <span className="mt-0.5 block text-xs font-normal text-muted">
            Does not change your theme or log you out.
          </span>
        </button>
        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <Link
            href={portalHref("/about")}
            className="text-link hover:underline"
          >
            About Janark
          </Link>
          <Link
            href={portalHref("/terms")}
            className="text-link hover:underline"
          >
            Terms
          </Link>
        </div>
      </Section>
    </div>
  );
}

