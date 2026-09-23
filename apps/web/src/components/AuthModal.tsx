"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getPhoneSession,
  isLoggedInClient,
  requirePhoneVoterKey,
  savePhoneSession,
  type PhoneSession,
} from "@/lib/client-id";
import { PhoneAuth } from "@/components/PhoneAuth";

type AuthCtx = {
  session: PhoneSession | null;
  /** Open login modal only when an action needs auth */
  openLogin: (opts?: {
    reason?: string;
    onSuccess?: (session: PhoneSession) => void;
  }) => void;
  closeLogin: () => void;
  /**
   * Returns a sentinel if logged in; otherwise opens modal and returns null.
   * Real identity is bound server-side from the httpOnly session cookie.
   */
  ensureAuth: (reason?: string) => string | null;
  refreshSession: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PhoneSession | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("post or react");
  const [onSuccess, setOnSuccess] = useState<
    ((s: PhoneSession) => void) | null
  >(null);

  const refreshSession = useCallback(() => {
    setSession(getPhoneSession());
  }, []);

  useEffect(() => {
    const local = getPhoneSession();
    setSession(local);
    // Reconcile UI session with httpOnly cookie
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) {
          if (local) {
            // Cookie gone — clear stale UI session only (avoid logout POST loop)
            try {
              localStorage.removeItem("janark_phone_session");
            } catch {
              /* ignore */
            }
            setSession(null);
          }
          return;
        }
        const data = await r.json();
        if (data.session) {
          savePhoneSession(data.session);
          setSession(data.session);
        }
      })
      .catch(() => {});
  }, []);

  const closeLogin = useCallback(() => {
    setOpen(false);
    setOnSuccess(null);
  }, []);

  const openLogin = useCallback(
    (opts?: {
      reason?: string;
      onSuccess?: (session: PhoneSession) => void;
    }) => {
      if (isLoggedInClient()) {
        opts?.onSuccess?.(getPhoneSession()!);
        return;
      }
      setReason(opts?.reason ?? "post or react on Janark");
      setOnSuccess(() => opts?.onSuccess ?? null);
      setOpen(true);
    },
    [],
  );

  const ensureAuth = useCallback(
    (actionReason?: string) => {
      const key = requirePhoneVoterKey();
      if (key) return key;
      openLogin({
        reason: actionReason ?? "post or react on Janark",
      });
      return null;
    },
    [openLogin],
  );

  return (
    <Ctx.Provider
      value={{
        session,
        openLogin,
        closeLogin,
        ensureAuth,
        refreshSession,
      }}
    >
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-chrome/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLogin();
          }}
        >
          <div className="max-h-[min(92dvh,100%)] w-full max-w-md overflow-y-auto border border-line bg-white shadow-xl sm:max-h-[90vh] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="sticky top-0 z-10 border-b border-line bg-cream px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Login required
                  </p>
                  <h2
                    id="login-modal-title"
                    className="font-display mt-1 text-xl text-navy sm:text-2xl"
                  >
                    Log in with your phone
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeLogin}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-muted hover:text-navy"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">
                To {reason}, confirm with a one-time code.
              </p>
            </div>

            <div className="space-y-3 border-b border-line bg-sand/40 px-4 py-4 text-sm text-navy/90 sm:px-5">
              <p className="font-medium text-navy">
                We keep complete anonymity
              </p>
              <p className="text-muted">
                Your identity stays private. Phone OTP only proves you are a
                real person — it is never used as a public label.
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-muted">
                <li>Your phone number is never shown publicly.</li>
                <li>We store only a one-way hash — not your plaintext number.</li>
                <li>
                  You get a public{" "}
                  <strong className="text-navy">anonymity ID</strong> (e.g.
                  jn-a7k2m9xq) so others can see your posts and reactions —
                  never your number.
                </li>
                <li>No name, email, or real-world identity is required.</li>
              </ul>
            </div>

            <div className="p-4 sm:p-5">
              <PhoneAuth
                onVerified={(s) => {
                  setSession(s);
                  onSuccess?.(s);
                  closeLogin();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
