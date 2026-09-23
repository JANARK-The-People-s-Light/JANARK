"use client";

import { useCallback, useEffect, useState } from "react";
import { CIVIC_POST_TERMS_VERSION } from "@/lib/civic-post-terms";

const STORAGE_KEY = "janark_civic_terms_accepted";

/** True when this browser already accepted the current Terms version. */
export function hasRememberedCivicPostTerms(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === CIVIC_POST_TERMS_VERSION;
  } catch {
    return false;
  }
}

/** Persist acceptance for the current Terms version (default-check later). */
export function rememberCivicPostTermsAccepted() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, CIVIC_POST_TERMS_VERSION);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Checkbox state for Civic Posting Terms.
 * First visit: unchecked. After the user accepts once (this version),
 * later forms open with the checkbox already checked.
 */
export function useCivicPostTermsAccept() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(hasRememberedCivicPostTerms());
  }, []);

  const onAcceptedChange = useCallback((next: boolean) => {
    setAccepted(next);
    if (next) rememberCivicPostTermsAccepted();
  }, []);

  return [accepted, onAcceptedChange] as const;
}
