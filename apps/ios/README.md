# Janark for iOS

Native SwiftUI client for Janark — India's open-source platform for civic participation.
Thin HTTP client of the monorepo web API (`apps/web` → `/api/*`).

Browse is free; phone OTP is required only to post, vote, comment, sign, or flag. Public identity is an anonymity ID (`jn-xxxxxxxx`), never a phone number. No local civic database.

**Public launch:** 26 January 2027.  
**Monorepo path:** `apps/ios` (SwiftUI, iOS 17+).

## Coverage

| Area | Coverage |
|------|----------|
| **Home feed** | Filters, civic sorts, search, hashtags, location |
| **Create** | Share, Report, Issue, Petition, Vote, Discussion, Notice, Meme (+ terms gate) |
| **Act** | Sign petitions, report reactions, ballots, discussions |
| **Engage** | Up/down, comments (edit/delete), flags, native share tracking |
| **You** | OTP (`janark_sid` cookie), profile, follow, activity, themes, API base URL |
| **Detail** | Petition, report, issue, vote, discussion, share, notice, meme, public `/p` |

## Requirements

- Xcode 15+ (iOS 17 SDK), Swift 5.9+
- Running API from repo root:

```bash
cd ../..          # monorepo root
npm run db:mongo
npm run dev:web
# or: docker compose up -d
```

## Open in Xcode

```bash
open apps/ios/Janark.xcodeproj
```

Or regenerate the project with [XcodeGen](https://github.com/yonaskolb/XcodeGen) if you prefer:

```bash
cd apps/ios && xcodegen generate && open Janark.xcodeproj
```

## Point at your server

| Target | URL |
|--------|-----|
| Simulator | `http://127.0.0.1:3000` (default) |
| Device | `http://<lan-ip>:3000` via Settings → Server (`NSAllowsLocalNetworking` enables cleartext LAN) |
| Production | HTTPS origin; must match `NEXT_PUBLIC_SITE_URL` |

Changing the API base URL signs you out locally (clears cookies) so you do not keep a stale session for the previous host.

`Origin` / `Referer` are rewritten from Android-style emulator hosts if used; cookies use shared `HTTPCookieStorage`. Session cookies (`janark_sid`) are only marked `Secure` when the server site URL is `https://`, so OTP works over plain HTTP to Docker / local.

Local HTTP is allowed via `NSAllowsLocalNetworking` in `Info.plist`.

With `EXPOSE_DEV_OTP=1` on the server, the login screen shows the Dev OTP.

## Layout

```text
Janark/
  Core/ Domain/          # constants, href routing, terms
  Data/Net|Repo|Session  # URLSession + cookies + repository
  UI/                    # SwiftUI screens + shell + themes
```

## Docs

[docs/handbook.md](../../docs/handbook.md) · [docs/product.md](../../docs/product.md)

## License / trademark

Use of the JANARK name and logo follows the Janark project’s Business Source License / trademark terms.
