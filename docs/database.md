# Database

## Canonical — Prisma / SQLite

**Source of truth** for civic entities, auth, engagement, flags, and telemetry.

Examples: issues, petitions (`PublicDemand`), reports, proposals/votes, notices, shares, memes, engagement votes/comments, content flags, phone identity/OTP/sessions, follows, preferences blob, rate-limit buckets, visit sessions.

Clients **must not** keep an authoritative civic copy.

## Mirror — MongoDB

Public-square projections ([ADR-0003](./adr/0003-dual-write-strategy.md)):

| Collection | Role |
|------------|------|
| `FeedPost` | Unified home feed cards (dual-write on create) |
| `Trend` | Hashtag / social trend bumps |
| `Activity` | Dashboard activity stream |
| `Discussion` | Discussion projection where used |

Home feed reads primarily from Mongo; creates write Prisma first, then best-effort `mirrorFeedCard`.

## Object storage

Citizen media via `STORAGE_PROVIDER` (`local` default, SeaweedFS ready — [ADR-0001](./adr/0001-storage-provider.md)). URLs are `/uploads/...` (served by `/api/uploads/[filename]`).

## Not in this cut

- PostgreSQL (optional later for multi-instance writes)
- Meilisearch ([ADR-0002](./adr/0002-search-index.md) — not running; search is `contains` / `$regex` today)
- Offline Room / Core Data civic caches as SoT
