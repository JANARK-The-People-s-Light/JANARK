# Janark for Android

Native Android client for Janark — India's first open source social platform.
Thin HTTP client of the monorepo web API (`apps/web` → `/api/*`).

Browse is free; phone OTP is required only to post, vote, comment, sign, or flag. Public identity is an anonymity ID (`jn-xxxxxxxx`), never a phone number. No local civic database.

**Public launch:** 26 January 2027.  
**Monorepo path:** `apps/android` (Jetpack Compose).

## Coverage

| Area | Coverage |
|------|----------|
| **Home feed** | Filters, civic sorts, search, hashtags, location |
| **Create** | Share, Report, Issue, Petition, Vote, Discussion, Notice, Meme (+ terms gate) |
| **Act** | Sign petitions, report reactions, ballots, discussions |
| **Engage** | Up/down, comments, flags, native share tracking |
| **You** | OTP (`janark_sid`), profile, follow, activity, themes, API base URL |

## Requirements

- Android Studio (AGP 8.10+, Kotlin 2.1+), JDK 17, minSdk 26
- Running API from repo root:

```bash
cd ../..          # monorepo root
npm run db:mongo
npm run dev:web
```

## Point at your server

| Target | URL |
|--------|-----|
| Emulator | `http://10.0.2.2:3000` (default) |
| Device | `http://<lan-ip>:3000` via Settings → Server |
| Production | HTTPS origin; must match `NEXT_PUBLIC_SITE_URL` |

Changing the API base URL clears cookies and local session so OTP must be repeated against the new host.

`Origin` / `Referer` are rewritten from emulator hosts (`10.0.2.2`, `10.0.3.2`) to `localhost` so they match `NEXT_PUBLIC_SITE_URL`. The web Origin allowlist also accepts those emulator hosts and LAN IPs in non-production.

Session cookies (`janark_sid`) are only marked `Secure` when `NEXT_PUBLIC_SITE_URL` is `https://`, so OTP login works over plain HTTP to Docker / emulator.

With `EXPOSE_DEV_OTP=1` on the server, the login screen shows the Dev OTP.

## Open in Android Studio

Open the `apps/android` folder (not the monorepo root). Use the Gradle wrapper in this directory.

## Docs

[docs/mobile.md](../../docs/mobile.md) · [docs/api.md](../../docs/api.md) · [docs/authentication.md](../../docs/authentication.md)

## License / trademark

Use of the JANARK name and logo follows the Janark project’s Business Source License / trademark terms.
