/**
 * Fail closed in production when secrets / infra are misconfigured.
 * Call once from middleware (and optionally at process start).
 */

const DEV_SALT_DEFAULTS = new Set([
  "janark-dev-salt-change-me",
  "janark-dev-human-secret",
  "janark-dev-ip-salt",
]);

let checked = false;

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function assertProductionSecurity(): void {
  if (checked || !isProductionRuntime()) return;
  // next build sets NODE_ENV=production — do not fail the compile step
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  ) {
    return;
  }
  checked = true;

  const errors: string[] = [];

  const phoneSalt = process.env.PHONE_HASH_SALT ?? "";
  if (!phoneSalt || DEV_SALT_DEFAULTS.has(phoneSalt) || phoneSalt.length < 24) {
    errors.push(
      "PHONE_HASH_SALT must be set to a strong unique value (≥24 chars), not the dev default",
    );
  }

  const human =
    process.env.HUMAN_TOKEN_SECRET || process.env.PHONE_HASH_SALT || "";
  if (!human || DEV_SALT_DEFAULTS.has(human) || human.length < 24) {
    errors.push("HUMAN_TOKEN_SECRET must be set to a strong unique value (≥24 chars)");
  }

  const ipSalt =
    process.env.IP_HASH_SALT || process.env.PHONE_HASH_SALT || "";
  if (!ipSalt || DEV_SALT_DEFAULTS.has(ipSalt) || ipSalt.length < 24) {
    errors.push("IP_HASH_SALT must be set to a strong unique value (≥24 chars)");
  }

  if (process.env.EXPOSE_DEV_OTP === "1") {
    // Allowed only with the explicit no-SMS demo override (e.g. local Docker)
    if (process.env.ALLOW_OTP_WITHOUT_SMS !== "1") {
      errors.push("EXPOSE_DEV_OTP must not be enabled in production");
    }
  }

  if (!process.env.MONGODB_URI?.trim()) {
    errors.push("MONGODB_URI is required in production (no in-memory fallback)");
  }

  if (!process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    errors.push("NEXT_PUBLIC_SITE_URL is required in production (for Origin checks)");
  } else {
    const site = process.env.NEXT_PUBLIC_SITE_URL.trim();
    if (
      !site.startsWith("https://") &&
      process.env.ALLOW_HTTP_SITE_URL !== "1"
    ) {
      errors.push(
        "NEXT_PUBLIC_SITE_URL must be an https:// origin in production (set ALLOW_HTTP_SITE_URL=1 only for local Docker demos)",
      );
    }
  }

  // SMS must be configured unless an explicit (dangerous) override is set
  const smsOk =
    Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) ||
    Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) ||
    process.env.ALLOW_OTP_WITHOUT_SMS === "1";

  if (!smsOk) {
    errors.push(
      "Configure OTP SMS (Twilio or MSG91) or set ALLOW_OTP_WITHOUT_SMS=1 only if you accept that OTP cannot be delivered",
    );
  }

  if (errors.length) {
    throw new Error(
      `[Janark security] Refusing to start in production:\n- ${errors.join("\n- ")}`,
    );
  }
}

export function allowDevOtpInResponse(): boolean {
  if (process.env.EXPOSE_DEV_OTP !== "1") return false;
  // Local/dev, or production compose demo with ALLOW_OTP_WITHOUT_SMS
  if (!isProductionRuntime()) return true;
  return process.env.ALLOW_OTP_WITHOUT_SMS === "1";
}
