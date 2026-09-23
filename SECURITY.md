# Security Policy

## Supported versions

Security fixes are prioritized for the latest `main` (default) branch of this
repository. If you run a fork or pinned release, please rebase or cherry-pick
fixes promptly.

## Reporting a vulnerability

Janark handles phone OTP hashes, anonymity IDs, and civic user content. Please
report security issues **privately** so we can fix them before public disclosure.

**Do not** open a public GitHub issue for:

- Authentication / OTP bypass
- Exposure of phone numbers or hashes
- Injection, XSS, SSRF, or privilege escalation
- Data leaks involving citizen content or PII

### How to report

1. Prefer **GitHub Security Advisories** (private) on the Janark repository, if
   enabled: *Security → Report a vulnerability*.
2. Or email the maintainers via the contact published on the
   [JANARK - The People's Light](https://github.com/JANARK-The-People-s-Light)
   organization profile.

Include:

- A clear description of the issue and impact
- Steps to reproduce (PoC)
- Affected paths, commits, or environment (local / production)
- Whether you plan to disclose publicly and on what timeline

### What to expect

- Acknowledgement when a maintainer can respond
- An initial assessment (accepted, needs more info, or declined)
- A fix or mitigation plan when the report is confirmed
- Credit in release notes if you want to be named (optional)

We ask that you give us a reasonable window to ship a fix before public
write-ups.

## Non-security bugs

Use public GitHub Issues for ordinary bugs and feature requests. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Production hosting checklist

Before exposing Janark on the public internet:

1. Set strong unique `PHONE_HASH_SALT`, `HUMAN_TOKEN_SECRET`, and `IP_HASH_SALT`
   (≥24 random characters). The process refuses to start in production with
   defaults.
2. Set `NEXT_PUBLIC_SITE_URL` to your real HTTPS origin (used for Origin checks).
3. Set `MONGODB_URI` to a real MongoDB (no in-memory fallback in production).
4. Configure OTP SMS via Twilio or MSG91. Do **not** set `EXPOSE_DEV_OTP`.
5. Prefer HTTPS everywhere; HSTS is enabled when `NODE_ENV=production`.
6. Enable Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` +
   `TURNSTILE_SECRET_KEY`) for OTP abuse resistance.
7. Keep `ALLOW_CITIZEN_SOCIAL_PUBLISH` unset unless you intentionally want
   citizen shares to post to your configured outbound channels.
8. Use a managed database (Postgres recommended over SQLite) for multi-instance
   deploys; SQLite file paths are fine only for single-node demos.

## Visit telemetry (privacy)

Every visit may record device / browser / coarse location signals for abuse
resistance and product analytics. Rules:

- **Raw IP addresses are never stored** — only salted hashes (`IP_HASH_SALT`).
- **Phone numbers are never stored** in telemetry. After OTP login, an opaque
  `visitorId` is linked to `phoneHash` server-side only.
- **Public profiles still show `anonId` only** — never phone, IP, or visit
  fingerprints.
- Telemetry APIs never return `phoneHash`, IP, or full snapshots to browsers.
- Keystroke **content** and clipboard **text** are not collected — counts only.
- Cookie **values** (including `janark_sid`) are not stored — names may be.

### Auth model

- Sessions are **httpOnly**, `Secure` (production), `SameSite=Lax` cookies.
- Phone hashes are never returned to the browser or stored in `localStorage`.
- Client-supplied `voterKey` values are ignored for authorization.

## Safe local development

- Never commit `.env` or real salt values
- Use `EXPOSE_DEV_OTP=1` only on local machines
- Treat demo / seed data as non-production

## License

This project is licensed under the [Business Source License 1.1](LICENSE).
Security fixes are contributions under the same license. See also
[TRADEMARK.md](TRADEMARK.md).
