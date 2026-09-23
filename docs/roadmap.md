# Roadmap

Where the repo is headed. Track near-term work here; durable decisions live in [ADRs](./adr/README.md). Current system shape: [architecture.md](./architecture.md) · [database.md](./database.md).

> **How to read this file**  
> **Done** and **Current architecture** describe what ships today.  
> **Next** and **Evolution** are planned tracks — not live infrastructure.  
> Do not treat aspirational diagrams (Postgres-only core, Valkey, OpenSearch, Kafka, dedicated workers) as the running stack unless an ADR says so and the code matches.

---

## Done (current cut)

- Monorepo: `apps/web` + `apps/android` + `apps/ios`
- **Prisma + SQLite** as source of truth; **Mongo** as best-effort feed / trends / activity mirror ([ADR-0003](./adr/0003-dual-write-strategy.md))
- Phone OTP sessions (`janark_sid`); Origin allowlist; Secure cookies when site URL is HTTPS
- Civic surfaces: issues, petitions, reports, votes, discussions, notices, memes, shares
- Portal **Pulse** (`/dashboard`) — nationwide / near-you civic overview
- Maintainer applications (`/maintainers`) — essentials-first form + optional sections
- Native parity for create/browse/engage/follow/profile/settings (thin API clients)
- Validators: `validate:smoke` / `features` / `telemetry` / `mobile` / `native`
- Object-storage abstraction — **local default**, SeaweedFS-ready ([ADR-0001](./adr/0001-storage-provider.md))
- External config pillars (`config/`) + zero-hardcoding rule
- Marketing `/` vs portal under `/unreleased` (middleware rewrite)
- Portal shell: fixed side rails; center column scrolls independently
- Ads framework: config-driven placements, AdSense split, `/ads.txt` (**off by default**)

---

## Current architecture (facts)

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

| Concern | Today |
|---------|--------|
| Authoritative civic + auth data | **SQLite via Prisma 7** |
| Home feed / trends / Pulse projections | **Mongo** (dual-write *after* Prisma; failures must not undo SQLite) |
| Media | **Local disk** (`/uploads/…`); SeaweedFS optional |
| Search | Prisma `contains` / Mongo `$regex` — Meilisearch planned ([ADR-0002](./adr/0002-search-index.md)) |
| Queues / Redis / Valkey / BullMQ | **Not in the stack** |
| PostgreSQL | **Not live** — optional later if SQLite limits appear |
| Shared `packages/` libs | **Empty placeholder** (M3+) |
| API process | Same Next.js app — no Nest/Fastify split |

**Surfaces**

| URL | Role |
|-----|------|
| `/` | Marketing landing — public launch **26 January 2027** |
| `/maintainers` | Public maintainer apply (marketing path) |
| `/unreleased` · `/unreleased/*` | Portal preview until launch |
| `/api/*` | Shared JSON API for web + native |

---

## Next

| Track | Focus | Notes |
|-------|--------|--------|
| **M3 shared package** | Types / OpenAPI stubs under `packages/` | Clients stay thin; avoid premature microservices |
| **Search** | Meilisearch ([ADR-0002](./adr/0002-search-index.md)) | Index *after* successful Prisma writes; never block civic posts |
| **Storage ops** | Production SeaweedFS / CDN ([ADR-0001](./adr/0001-storage-provider.md)) | Keep `/uploads/{key}` URLs |
| **Ads go-live** | Publisher approval, real slot IDs, production `ads.txt` | Master switch stays env-gated |
| **Feed hardening** | Reduce dual-write drift; document rebuild-from-SQLite path | Mongo removal is **last** ([ADR-0003](./adr/0003-dual-write-strategy.md)) |
| **Postgres option** | Multi-writer SoT **if** SQLite becomes a limit | Migrate via Prisma; do not claim Postgres is SoT today |
| **Async projections (later)** | Outbox → worker → feed/search/notifications | Prefer this *over* expanding sync dual-writes; only when load justifies a worker |
| **Ephemeral cache/queue (later)** | Valkey (or Redis-compatible) for rate limits / sessions cache / BullMQ | Not required for launch; SQLite rate buckets work locally |
| **Hardening** | Real SMS OTP, Turnstile in prod, drop `EXPOSE_DEV_OTP` | |
| **Launch** | Public `/` product surface for **26 Jan 2027** | Collapse `/unreleased` into `/` when ready |

### Suggested order (do not skip ahead)

1. Meilisearch + SeaweedFS (cut search regex and multi-replica media pain)  
2. Feed served without depending on Mongo for *new* features  
3. Evaluate Postgres only if write concurrency / ops demand it  
4. Add queue + workers when sync request path is too heavy  
5. Remove Mongo last, after feed/trends/Pulse are proven elsewhere  

---

## Evolution principles (keep these)

Useful ideas from architecture reviews — framed as **rules for change**, not as “already built”:

1. **One authoritative durable store** — today SQLite; later Postgres *only if needed*. Never two SoTs.
2. **Strong transactions for civic actions** — votes, signatures, supports belong in the relational SoT.
3. **Derived views are disposable** — feed cards, trends, search indexes, notification fan-out can be rebuilt.
4. **No synchronous dual-write expansion** — do not add new stores that must update in the same request as Prisma.
5. **Workers when justified** — notifications, media processing, search indexing, social publish; keep Next.js as the web/API BFF.
6. **Object storage for binaries** — S3 API; SeaweedFS preferred for self-host ([ADR-0001](./adr/0001-storage-provider.md)).
7. **Scale subsystems without premature microservices** — one Next.js deploy + optional worker process beats a Nest rewrite.
8. **Open-source infra where practical** — Valkey over proprietary Redis forks when a cache/queue is introduced; Meilisearch over OpenSearch for first search cut (lighter ops).

### Explicitly *not* day-one targets

| Proposal often seen | Janark stance |
|---------------------|---------------|
| Replace SQLite+Mongo with Postgres **immediately** | Premature — SQLite SoT + Mongo mirror is intentional until ADRs complete |
| OpenSearch mandatory | No — Meilisearch first ([ADR-0002](./adr/0002-search-index.md)); OpenSearch only if Meilisearch fails scale needs |
| Kafka / event bus | Non-goal this horizon |
| GraphQL | Non-goal |
| React Native rewrite | Non-goal |
| Separate Nest/Fastify API | Non-goal |
| Authoritative offline civic DB on device | Non-goal |
| Invented `apps/web/server/` + `repositories/` tree as current layout | Does not match the repo; evolve domain modules *inside* existing `lib/` + route handlers gradually |

---

## Non-goals (this horizon)

- React Native rewrite
- Authoritative offline civic DB on device
- Separate Nest/Fastify API process
- Kafka / multi-region active-active
- Making Mongo (or any mirror) the source of truth

---

## Corrections log (doc hygiene)

The long “production-grade architecture” draft previously pasted into this file mixed **review advice** with **current facts**. Common mistakes that were wrong for Janark *today*:

- Claiming **PostgreSQL** (or Postgres 18) is already the durable core  
- Treating **Valkey / BullMQ / OpenSearch / Kafka** as present  
- Calling sync **SQLite→Mongo dual-write** the target end-state (it is transitional; ADR-0003)  
- Assuming **SeaweedFS** is default storage (local is default)  
- Assuming **`packages/`** already ships shared clients  
- Describing ads as live (framework exists; **off until env enables**)  
- Treating marketing `/` as the portal (portal is `/unreleased` until launch)

Those ideas may still inform **Evolution** above — only after ADRs and code catch up.

---

## Related

- [architecture.md](./architecture.md) · [database.md](./database.md) · [configuration.md](./configuration.md) · [ads.md](./ads.md) · [mobile.md](./mobile.md)
- ADRs: [0001 storage](./adr/0001-storage-provider.md) · [0002 search](./adr/0002-search-index.md) · [0003 dual-write](./adr/0003-dual-write-strategy.md)

Update this file when milestones land; keep ADRs for durable decisions.
