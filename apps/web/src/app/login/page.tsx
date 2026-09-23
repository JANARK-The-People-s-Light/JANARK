"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneAuth } from "@/components/PhoneAuth";
import { getPhoneSession } from "@/lib/client-id";
import Link from "next/link";
import { portalHref } from "@/lib/paths";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || portalHref("/feed");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (getPhoneSession()?.authenticated || getPhoneSession()?.anonId) {
      router.replace(portalHref(next.startsWith("/") ? next : "/feed"));
      return;
    }
    setChecking(false);
  }, [router, next]);

  if (checking) {
    return (
      <p className="text-center text-sm text-muted">Checking session…</p>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-muted">Optional login</p>
      <h1 className="font-display mt-2 text-3xl text-navy">
        Log in with your phone
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You can browse Janark without logging in. Phone OTP is only needed to
        post or react. We keep complete anonymity — we store a one-way hash
        only, never show your number, and you appear as Anonymous citizen.
      </p>

      <div className="mt-6 space-y-2 border-l-2 border-amber/60 pl-4 text-sm text-muted">
        <p className="font-medium text-navy">Complete anonymity</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Number never shown publicly</li>
          <li>Only a one-way hash is stored</li>
          <li>No name, email, or public profile</li>
        </ul>
      </div>

      <div className="mt-8">
        <PhoneAuth
          onVerified={() => {
            router.replace(portalHref(next.startsWith("/") ? next : "/feed"));
          }}
        />
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        <Link href={portalHref("/")} className="text-link hover:underline">
          Back to portal
        </Link>
        {" · "}
        <Link href={portalHref("/about")} className="text-link hover:underline">
          About anonymity
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-16 text-center text-sm text-muted">Loading…</p>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
