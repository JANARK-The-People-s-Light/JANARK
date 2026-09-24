# Handbook

Technical source of truth for Janark. Product intent and roadmap: [product.md](./product.md). Durable decisions: [adr/](./adr/README.md).

> Facts below describe what ships **today**. Planned work lives in [product.md](./product.md) — do not treat Meilisearch, SeaweedFS-as-default, Postgres, Valkey, or workers as live unless an ADR and code say so.

---

## 1. Principles

1. **One API** — Web, Android, and iOS call the same `/api/*`.
2. **One source of truth** — Prisma / SQLite for civic data + auth; Mongo mirrors public feed ([ADR-0003](./adr/0003-dual-write-strategy.md)).
3. **Backend owns rules** — eligibility, rate limits, ownership, terms gates are server-side.
4. **Clients are thin** — no authoritative local civic DB.
5. **Native UIs stay native** — Compose and SwiftUI; no React Native this cut.
6. **Config over literals** — layout, copy, rules, and ads come from repo-root `config/`.

---

## 2. Topology & layout

```text
  Web / Android / iOS
           │  HTTPS · REST / JSON · /api/*
           ▼
  apps/web  (Next.js 16 + React 19 + TypeScript + Tailwind 4)
           │
     ┌─────┼──────────────────────────┐
     ▼     ▼                          ▼
  SQLite   Mongo (mirror)        Local uploads
  Prisma   FeedPost / Trend /    (SeaweedFS via
  SoT      Activity / …          STORAGE_PROVIDER)
```

| Path | Role |
|------|------|
| `apps/web` | Portal + API (`@janark/web`) |
| `apps/android` | Kotlin Compose thin client |
| `apps/ios` | SwiftUI thin client (iOS 17+) |
| `prisma/` | Schema + migrations (repo root) |
| `packages/` | Reserved for shared TS libs (M3+) |
| `config/` | Sys / rules / templates / schema / fallbacks · `config/ads/` · `config/maintainers.json` |
| `scripts/` | Validators (`validate:*`) |
| `docker/` | Entrypoint + compose assets |

| URL | Role |
|-----|------|
| `/` | Marketing landing — public launch **26 January 2027** |
| `/maintainers` | Public maintainer apply |
| `/unreleased` · `/unreleased/*` | Portal preview until launch |
| `/api/*` | Shared JSON API |
| `/ads.txt` | Ad sellers list (when configured) |

**Web chrome:** landing is `LandingPage` (config-driven). Portal shell: fixed header; left nav + scrollable center + right trends; rails do not scroll with the feed.

---

## 3. Data plane

### SQLite (Prisma) — SoT

Civic entities, auth, engagement, flags, telemetry. Examples: issues, petitions (`PublicDemand`), reports, proposals/votes, notices, shares, memes, comments, flags, phone identity/OTP/sessions, follows, preferences, rate-limit buckets, visit sessions, interaction events.

### Mongo — mirror ([ADR-0003](./adr/0003-dual-write-strategy.md))

| Collection | Role |
|------------|------|
| `FeedPost` | Home feed cards (dual-write on create) |
| `Trend` | Hashtag / social trend bumps |
| `Activity` | Pulse / dashboard stream |
| `Discussion` | Discussion projection where used |

Creates: **Prisma first**, then best-effort `mirrorFeedCard`. Mirror failure must not undo SQLite. Helpers also exist to project feed cards from SQLite when Mongo is empty (`feed-from-sqlite.ts`).

### Object storage ([ADR-0001](./adr/0001-storage-provider.md))

`STORAGE_PROVIDER=local` (default) or `seaweedfs`. Public URLs stay `/uploads/...` via `/api/uploads/[filename]`.

### Not in this cut

- PostgreSQL (optional later if SQLite limits appear)
- Meilisearch ([ADR-0002](./adr/0002-search-index.md) — search today is `contains` / `$regex`)
- Queues / Redis / Valkey / BullMQ
- Offline Room / Core Data as SoT

---

## 4. Authentication

| Rule | Detail |
|------|--------|
| Browse | Free |
| Write | Phone OTP (post, vote, comment, sign, flag, upload, …) |
| Phone | Hash only (`PHONE_HASH_SALT`); never public |
| Public ID | `anonId` (`jn-xxxxxxxx`) |
| Session | httpOnly cookie `janark_sid` → `AuthSession` (token hashed at rest) |
| Secure cookie | Only when site URL is `https://` |

| Step | Endpoint |
|------|----------|
| Request OTP | `POST /api/auth/phone/request` |
| Verify | `POST /api/auth/phone/verify` → sets cookie |
| Soft refresh | `GET /api/auth/me` |
| Logout | `POST /api/auth/logout` |

Local/demo: `EXPOSE_DEV_OTP=1` (and optionally `ALLOW_OTP_WITHOUT_SMS`) may return `devCode`. **Never** enable OTP echo in production — see [SECURITY.md](../SECURITY.md). SMS: Twilio and/or MSG91. Turnstile optional when keys are set; native UAs `Janark-Android/` / `Janark-iOS/` skip Turnstile.

`voterKey` on write bodies is bound from the session server-side — ignore client-supplied hashes for auth.

---

## 5. API

One public HTTP API under `apps/web/src/app/api/**`. Do not add a parallel civic backend for mobile.

| Area | Paths |
|------|--------|
| Auth | `/api/auth/phone/request`, `/verify`, `/me`, `/logout` |
| Maintainers | `POST /api/maintainers` |
| Feed | `/api/feed`, `/api/feed/[id]` |
| Issues | `/api/issues`, `/api/issues/[slug]` |
| Petitions | `/api/demands`, `/api/demands/[id]` |
| Reports | `/api/reports`, `/api/reports/[id]` |
| Votes | `/api/proposals`, `/api/votes/[id]`, `/api/votes/me` |
| Shares | `/api/shares`, `/api/shares/[id]` |
| Notices | `/api/notices`, `/api/notices/[id]` |
| Memes | `/api/memes`, `/api/memes/[id]` |
| Discussions | `/api/discussions` |
| Engage | `/api/engage`, `/api/comments`, `/api/comments/[id]` |
| Flags | `/api/flags` |
| Social | `/api/follow`, `/api/profiles/[anonId]` |
| Discovery | `/api/hashtags`, `/api/explore`, `/api/dashboard` |
| Prefs / media | `/api/preferences`, `/api/upload`, `/api/uploads/[filename]` |
| Telemetry / share | `/api/telemetry/visit`, `/api/telemetry/interaction`, `/api/social/share` |

Writes: validate in route handlers → Prisma → best-effort Mongo mirror. Android `Dtos.kt` / iOS `Models.swift` track JSON; OpenAPI planned (M3). Prefer additive changes.

### Telemetry & product interactions

Two SQLite layers (never mirrored to Mongo; privacy rules in [SECURITY.md](../SECURITY.md)):

| Model | Role |
|-------|------|
| `VisitSession` / `VisitEvent` | Opaque visitor sessions + low-level signals (pageview, click, scroll, heartbeat, …) via `VisitTelemetry` → `POST /api/telemetry/visit` |
| `InteractionEvent` | Discrete product events (search, vote, follow, ads, auth, creates, …) |

| Capture | How |
|---------|-----|
| Server writes | `trackInteraction()` from `apps/web/src/lib/interactions.ts` (engage, follow, flags, auth, prefs, upload, feedback, …); creates also emit `activity.*` via `recordActivity` |
| Client | `trackClientInteraction()` → `POST /api/telemetry/interaction` (header search, ad impression/click) |
| Feed filters | Sampled `search.query` / `explore.filter` on `GET /api/feed` when `q` / filters present |

Allowlisted event names, batch limits, and retention days: `config/rules.json` → `interactions` (fallbacks in `config/fallbacks.json`). Payload shape ref: `config/schema.json` → `apiPayloads.interactionEvent`. Validate with `npm run validate:telemetry`.

---

## 6. Configuration

Loader: `apps/web/src/lib/config` (`cfg`, `fill`). Ads runtime: `apps/web/src/config/ads`.

| File | Holds |
|------|--------|
| `sys.json` | Layout metrics, env key **names**, public links, paths, session/UA |
| `rules.json` | Feature flags, portal rails, feed thresholds, launch ISO date, **interactions** allowlist / limits |
| `templates.json` | Brand, landing, portal copy |
| `schema.json` | Config shape refs (incl. interaction payload) |
| `fallbacks.json` | Values only when a primary path is missing |
| `maintainers.json` | Maintainer apply form |
| `ads/*.json` | Providers, formats, placements, policy, copy |

**Procedure:** look up pillar → resolve env via named keys → on miss use fallbacks → edit JSON rather than inventing call-site literals. See `.cursor/rules/zero-hardcoding.mdc`.

---

## 7. Ads

**Default: off.** `NEXT_PUBLIC_ADS_ENABLED=true` plus publisher/slot IDs to serve live units.

| Placement | Where |
|-----------|--------|
| `sidebar` | Right rail (above Trending today) |
| `sidebar-below-trending` | Right rail (below trending hashtags) |
| `feed-middle` | Interleaved in feeds (interval choices in `policy.feedAdIntervalChoices`) |
| `post-bottom` | Detail pages |
| `home-top` / `feed-top` | Defined; disabled by default in placements |
| `mobile-bottom` | Defined; disabled by default |

Env: `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` (`ca-pub-…`), `NEXT_PUBLIC_ADSENSE_SLOT_*`, optional `ADS_TXT_LINES` (`pub-…` without `ca-`). Route: `/ads.txt`. Root layout emits `<meta name="google-adsense-account">` when a publisher id is set. Dev shows bordered placeholders when enabled; coming-soon `/` does not show ads. Middleware CSP allows AdSense hosts when monetization is used.

---

## 8. Local development

**Prerequisites:** Node.js 22+, Docker (Mongo), optional Android Studio / Xcode 15+.

Env at **repo root** `.env` (see `.env.example`). Prisma and `apps/web/next.config.ts` load it from there (`experimental.externalDir` for root `config/`).

```bash
cp .env.example .env
# DATABASE_URL, MONGODB_URI, PHONE_HASH_SALT (≥24); EXPOSE_DEV_OTP=1 for local OTP

npm run db:mongo
npm install
npm run db:push
npm run db:clear && npm run db:demo   # optional
npm run dev:web                       # http://localhost:3000
```

| Script | Purpose |
|--------|---------|
| `dev` / `dev:web` | Next.js (this **is** the API) |
| `build` / `build:web` / `start` | Production build & start |
| `typecheck` / `lint` | Gates |
| `db:generate` / `db:migrate` / `db:push` / `db:setup` | Prisma |
| `db:seed` / `db:demo` / `db:clear` / `db:clear-rate-limits` | Data |
| `validate` | typecheck + smoke + features + telemetry + mobile + native |

HTTP validators need a running server (`BASE_URL`, default `http://localhost:3000`).

```bash
docker compose up -d --build   # local HTTP verification only
# Public HTTPS: terminate TLS at the edge; set NEXT_PUBLIC_SITE_URL=https://janark.org
# (no ALLOW_HTTP_SITE_URL) and rebuild so Next public env + ads bake in.
```

Production hosting checklist: [SECURITY.md](../SECURITY.md).

---

## 9. Mobile

Thin clients against `/api/*`. Platform open steps: [Android README](../apps/android/README.md) · [iOS README](../apps/ios/README.md).

| | Android | iOS |
|--|---------|-----|
| UI | Jetpack Compose | SwiftUI (iOS 17+) |
| Session | OkHttp cookie jar | `HTTPCookieStorage` |
| Default API | Emulator `http://10.0.2.2:3000` | Simulator `http://127.0.0.1:3000` |

**Parity:** home feed, issues / petitions / reports / votes / shares / memes / notices, create (+ terms), engage, follow, profile, preferences, about, terms, OTP.

**Rules:** cookie auth after OTP; always send `Origin` / `Referer` matching API base (emulator → localhost for allowlist); no invented endpoints; upload then attach URL; UA `Janark-Android/…` / `Janark-iOS/…`.
