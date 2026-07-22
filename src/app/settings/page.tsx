"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthModal";
import { clearPhoneSession } from "@/lib/client-id";
import { portalHref } from "@/lib/paths";

export default function SettingsPage() {
  const { session, refreshSession, openLogin } = useAuth();
  const router = useRouter();

  function logout() {
    void clearPhoneSession().then(() => {
      refreshSession();
      router.push(portalHref("/"));
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">Account</p>
      <h1 className="font-display mt-1 text-3xl text-navy">Settings</h1>
      <p className="mt-3 text-sm text-muted">
        Manage your anonymous session. Phone numbers stay hashed — never shown
        on profiles.
      </p>

      <div className="mt-8 space-y-4 border-t border-line pt-8">
        {session?.anonId ? (
          <>
            <div className="rounded-xl border border-line bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted">
                Anonymity ID
              </p>
              <p className="mt-1 font-mono text-amber">{session.anonId}</p>
              <Link
                href={portalHref(`/u/${session.anonId}`)}
                className="mt-2 inline-block text-sm text-amber hover:underline"
              >
                View profile
              </Link>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy hover:border-danger hover:text-danger"
            >
              Log out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => openLogin({ reason: "manage settings" })}
            className="w-full rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-navy hover:bg-amber-bright"
          >
            Log in with phone
          </button>
        )}

        <p className="pt-6 text-xs text-muted">
          More account tools will appear here as you use Janark.
        </p>
      </div>
    </div>
  );
}
