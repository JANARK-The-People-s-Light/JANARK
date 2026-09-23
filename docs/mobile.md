# Mobile

Thin clients against the same Next.js `/api/*` as the web portal.

| | Android | iOS |
|--|---------|-----|
| Path | `apps/android` | `apps/ios` |
| UI | Jetpack Compose | SwiftUI (iOS 17+) |
| Session | OkHttp cookie jar | `HTTPCookieStorage` |
| Default API | Emulator → `http://10.0.2.2:3000` | Simulator → `http://127.0.0.1:3000` |

## Feature parity (current cut)

Home feed, issues / petitions / reports / votes / shares / **memes** / **notices**, create flows (including meme + notice), engage (like / comment / flag), follow, profile, activity, preferences themes, about, terms, login OTP.

## Layout (both platforms)

```text
Core/          Href, Outcome, time helpers
Data/Net/      HTTP + DTOs
Data/Repo/     JanarkRepository
Data/Session/  API base + prefs
UI/            Screens + components (mirror web concepts)
```

## Rules

1. Auth = cookie session after OTP; soft open via `/api/auth/me`.
2. Always send `Origin` / `Referer` matching the API base (emulator host rewritten to localhost for allowlist).
3. Do not invent endpoints or trust client-only eligibility.
4. Upload → `/api/upload`, then attach returned URL on create.
5. Keep User-Agent as `Janark-Android/...` / `Janark-iOS/...` (Turnstile skip).

## Setup

**Android:** Open `apps/android` in Android Studio; `JANARK_API_BASE_URL` in `gradle.properties` or local override.  
**iOS:** Open `apps/ios/Janark.xcodeproj` (regenerate with `xcodegen` from `project.yml` if needed).

Change API base anytime in **Settings → Server**.

## Related

[api.md](./api.md) · [authentication.md](./authentication.md) · [architecture.md](./architecture.md)
