# ADR-0002: Search index (Meilisearch)

## Status

Accepted — 2026-07-23

## Context

Search today is Prisma `contains` and Mongo `$regex` per surface. That lacks typo tolerance, ranking, autocomplete, and a unified global search. Scattering Meilisearch calls across routes would couple every write path to search availability.

## Decision

1. **Meilisearch is the single full-text search engine.**
2. **SQLite / Prisma remains the source of truth.** Index failures must not fail civic writes.
3. Introduce a small module boundary:
   - `apps/web/src/lib/search/client.ts` — Meilisearch client
   - `apps/web/src/lib/search/documents.ts` — document mappers
   - `apps/web/src/lib/search/indexer.ts` — `enqueueSearchIndex(...)` after successful writes
4. Initially indexing may run as an **in-process background task**; later move to a queue.
5. **First index set:** Issue, Report, Petition (Demand), Proposal, Share, Meme, Notice, FeedPost.
6. **Do not index comments** in the first iteration.
7. Feed/`q` and a future global `/api/search` should query Meilisearch, not regex.

## Consequences

- One search UX across civic types.
- Write path becomes: Prisma (and optional Mongo) → `enqueueSearchIndex`.
- Local/dev can keep regex fallback until Meilisearch is configured (`SEARCH_PROVIDER=none|meilisearch`).

## Alternatives considered

- Mongo text indexes — still not typo-tolerant; keeps Mongo as a search engine.
- Postgres FTS only — fine later with Postgres, but Meilisearch is lighter for ranking/autocomplete now while SQLite remains primary.
- Sync indexing inside the request — rejected; search outages must not block posts.
