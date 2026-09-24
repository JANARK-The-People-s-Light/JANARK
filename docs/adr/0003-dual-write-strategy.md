# ADR-0003: Dual-write strategy (Mongo)

## Status

Accepted — 2026-07-23

## Context

Janark dual-writes civic creates to SQLite (canonical) and Mongo `FeedPost` (public square cards, trends, activity). Mongo also hosts legacy discussions and denormalized vote counts. Once Meilisearch owns search and relational (or Postgres) data can drive feeds, Mongo’s value shrinks to “cache/index.”

## Decision

1. **Continue dual-write to Mongo** for feed cards, trends, and activity **until** feed generation, trending, activity, and related discovery can be served from SQLite/Postgres (+ Meilisearch / cache) with acceptable performance.
2. **Do not expand Mongo’s role** (no new collections for search or media).
3. Prefer new features to write **Prisma first**, then mirror to Mongo only when the home feed still requires it.
4. **Removal of Mongo is last** on the roadmap — after SeaweedFS, Meilisearch, and (if needed) Postgres — and only after verifying feed/trending/activity/analytics without it.

## Consequences

- Short-term: keep existing mirror helpers (`FeedPost.create`, `updateFeedMirrors`, `deleteFeedMirrors`).
- Medium-term: Meilisearch reduces reliance on `$regex` and tag scans in Mongo.
- Long-term: evaluate deleting Mongo to cut RAM and dual-write drift risk.
- Product analytics (`InteractionEvent`, visit telemetry) stay on **SQLite only** — do not add a Mongo analytics collection.
- Drift risk: rebuild / re-mirror can leave **duplicate `FeedPost` docs** for the same `publicId`. Read paths that list posts by author (e.g. Rising voices carousels via `popularPostsByAuthor`) must **dedupe by `publicId`**, not assume one doc per civic row.

## Alternatives considered

- Remove Mongo immediately — rejected; home feed and trends still depend on it.
- Make Mongo source of truth — rejected; auth, engage, and civic rows are already Prisma/ACID.
