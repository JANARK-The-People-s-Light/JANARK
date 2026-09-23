# Architecture

Janark is a **monorepo**: one Next.js API + portal, with thin native clients.

## Principles

1. **One API** — Web, Android, and iOS call the same `/api/*` surface.
2. **One source of truth** — Prisma/SQLite for civic data + auth; Mongo mirrors the public feed (ADR-0003).
3. **Backend owns rules** — eligibility, rate limits, ownership, terms gates live server-side.
4. **Clients are thin** — UI and local chrome only; no authoritative local civic DB.
5. **Native UIs stay native** — Compose and SwiftUI; no React Native rewrite planned for this cut.
6. **Config over literals** — layout, copy, rules, and ads come from `config/` ([configuration.md](./configuration.md)).

## Topology

```text
  ┌─────────────────────────────────────┐
  │  apps/web  (Next.js 16 App Router)  │
  │  Portal UI  +  /api/* route handlers│
  └──────────────┬──────────────────────┘
                 │
        SQLite (SoT) · Mongo (feed mirror) · uploads
                 │
     ┌───────────┼───────────┐
     ↓           ↓           ↓
  Web UI    apps/android  apps/ios
            (Compose)     (SwiftUI)
```

## Repository layout

| Path | Role |
|------|------|
| `apps/web` | Portal + API (`@janark/web`) |
| `apps/android` | Kotlin Compose thin client |
| `apps/ios` | SwiftUI thin client (iOS 17+) |
| `prisma/` | Schema + migrations (repo root) |
| `packages/` | Reserved for shared TS libs (M3+) |
| `config/` | Sys / rules / templates / schema / fallbacks · `config/ads/` |
| `scripts/` | Validators (`validate:*`) |
| `docker/` | Entrypoint + compose assets |
| `docs/` | This documentation |

## Surfaces

| URL | Role |
|-----|------|
| `/` | Marketing landing (launch **26 January 2027**) |
| `/unreleased` | Portal home feed |
| `/unreleased/*` | Full portal preview (middleware rewrite) |
| `/api/*` | JSON API for all clients |
| `/ads.txt` | Authorized digital sellers (when ads are configured) |

## Web chrome

| Piece | Behavior |
|-------|----------|
| Landing (`/`) | Structured page: header → logo-led hero → features → contribute → maintainers → footer (`LandingPage`) |
| Portal shell | Fixed viewport; **only the center column scrolls**; left nav + right rail stay put |
| Brand / launch | From `config/templates.json` + `config/rules.json` via `apps/web/src/lib/launch.ts` |
| Ads | Optional `<AdSlot />` placements — [ads.md](./ads.md) |

## Related

- [configuration.md](./configuration.md) · [database.md](./database.md) · [api.md](./api.md) · [authentication.md](./authentication.md) · [mobile.md](./mobile.md)
- Decisions: [adr/](./adr/README.md)
