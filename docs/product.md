# Product & roadmap

Product intent and where the repo is headed. Technical details: [handbook.md](./handbook.md). Durable decisions: [adr/](./adr/README.md).

> **How to read**  
> **Positioning / portal UX** and **Done** are current.  
> **Next** and **Evolution** are planned — not live infrastructure.

---

## Positioning

**Janark** — India's first open source social platform for civic action: issues, petitions, reports, votes, notices, shares, and memes; same rules on web and native.

Not a government portal or party channel. Browse free; phone OTP only to act. Public identity is an **anonymity ID**, never a phone number.

**Public launch:** 26 January 2027. Until then: marketing `/`; full portal under `/unreleased`; natives against `/api/*`.

**Civic Trend Score** ranks by velocity, discussion quality, diversity, freshness, and trust — not vanity likes alone. Publishing requires [Civic Posting Terms](/terms) (`apps/web/src/lib/civic-post-terms.ts`).

### Product principles

1. **Citizen first** — browse without an account; OTP only when writing.
2. **One civic square** — same content and rules on web, Android, and iOS.
3. **Honest identity** — public `anonId`; phone hashed at rest.
4. **Action over vanity** — feed cards drive engage / sign / vote.
5. **Open source** — ship in the open; decisions in ADRs.

---

## Marketing landing (`/`)

1. Header — brand, About, Terms, Open Source, GitHub  
2. Launch strip — public launch date (must stay visible)  
3. Hero — brand, tagline, support, Explore CTA  
4. Pillars — discuss / act / discover  
5. Contribute + maintainers  
6. Footer — launch date + links  

Copy/metrics: `config/templates.json` · `config/sys.json` (landing) · `config/maintainers.json`. Component: `LandingPage`.

## Portal UX

- Fixed header; left nav + scrollable center + right trends (rails stay put).
- Header search; create / browse / detail / profile / settings / about / terms; Pulse (`/dashboard`).
- Terms before write paths that require them.
- Optional ads when monetization env is enabled ([handbook § Ads](./handbook.md#7-ads)).
- Natives mirror capability, not pixel-perfect web chrome.

---

## Done (current cut)

- Monorepo: `apps/web` + `apps/android` + `apps/ios`
- Prisma + SQLite SoT; Mongo best-effort feed / trends / activity mirror ([ADR-0003](./adr/0003-dual-write-strategy.md))
- Phone OTP (`janark_sid`); Origin allowlist; Secure cookies on HTTPS site URL
- Civic surfaces + Pulse + maintainer apply
- Native parity (thin API clients)
- Validators: `validate:smoke` / `features` / `telemetry` / `mobile` / `native`
- Object-storage abstraction — local default, SeaweedFS-ready ([ADR-0001](./adr/0001-storage-provider.md))
- External `config/` pillars + zero-hardcoding
- Marketing `/` vs portal `/unreleased`
- Ads framework + `/ads.txt` (**off by default**)

### Current stack (facts)

| Concern | Today |
|---------|--------|
| Civic + auth SoT | SQLite via Prisma 7 |
| Feed / trends / Pulse | Mongo (dual-write after Prisma) |
| Media | Local disk; SeaweedFS optional |
| Search | `contains` / `$regex` — Meilisearch planned ([ADR-0002](./adr/0002-search-index.md)) |
| Queues / Valkey / BullMQ | Not in the stack |
| PostgreSQL | Not live |
| `packages/` | Empty placeholder (M3+) |
| API process | Same Next.js app — no Nest/Fastify |

---

## Next

| Track | Focus | Parent |
|-------|--------|--------|
| M3 shared package | Types / OpenAPI under `packages/` | [#31](https://github.com/JANARK-The-People-s-Light/JANARK/issues/31) |
| Search | Meilisearch ([ADR-0002](./adr/0002-search-index.md)) | [#28](https://github.com/JANARK-The-People-s-Light/JANARK/issues/28) |
| Storage ops | SeaweedFS / CDN ([ADR-0001](./adr/0001-storage-provider.md)) | [#29](https://github.com/JANARK-The-People-s-Light/JANARK/issues/29) |
| Ads go-live | Publisher, slots, production `ads.txt` | [#32](https://github.com/JANARK-The-People-s-Light/JANARK/issues/32) |
| Feed hardening | Drift visibility; rebuild-from-SQLite docs | [#30](https://github.com/JANARK-The-People-s-Light/JANARK/issues/30) |
| Postgres option | Multi-writer SoT **if** SQLite limits hit | [#35](https://github.com/JANARK-The-People-s-Light/JANARK/issues/35) |
| Async projections | Outbox → worker (later) | [#36](https://github.com/JANARK-The-People-s-Light/JANARK/issues/36) |
| Ephemeral cache | Valkey later | [#37](https://github.com/JANARK-The-People-s-Light/JANARK/issues/37) |
| Hardening | SMS OTP, Turnstile, drop DEV OTP | [#33](https://github.com/JANARK-The-People-s-Light/JANARK/issues/33) |
| Launch | Collapse `/unreleased` → `/` (26 Jan 2027) | [#34](https://github.com/JANARK-The-People-s-Light/JANARK/issues/34) |

Issues: Feature parents + Task children (`.github/ISSUE_TEMPLATE/parent.yml`, `task.yml`). Filter: [`label:roadmap`](https://github.com/JANARK-The-People-s-Light/JANARK/issues?q=is%3Aissue+label%3Aroadmap).

### Suggested order

1. Meilisearch + SeaweedFS  
2. Feed paths that do not depend on Mongo for *new* features  
3. Postgres only if write concurrency / ops demand it  
4. Queue + workers when sync path is too heavy  
5. Remove Mongo last  

---

## Evolution principles

1. One authoritative durable store — today SQLite; Postgres only if needed.  
2. Strong transactions for civic actions in the relational SoT.  
3. Derived views are disposable (feed, trends, search, notifications).  
4. No synchronous dual-write expansion.  
5. Workers when justified; keep Next.js as the BFF.  
6. Object storage for binaries (S3 API; SeaweedFS preferred for self-host).  
7. Scale without premature microservices.  
8. Prefer Valkey / Meilisearch over proprietary/heavy alternatives when introduced.

### Non-goals (this horizon)

React Native rewrite · offline civic DB on device · Nest/Fastify split · Kafka / GraphQL · Mongo (or any mirror) as SoT · inventing a parallel `apps/web/server/` tree as “current” layout.

### Corrections (doc hygiene)

Wrong claims to avoid: Postgres already SoT · Valkey/BullMQ/OpenSearch/Kafka present · dual-write as end-state · SeaweedFS default · `packages/` shipping · ads live · marketing `/` as the portal.

---

## Related

[handbook.md](./handbook.md) · ADRs [0001](./adr/0001-storage-provider.md) · [0002](./adr/0002-search-index.md) · [0003](./adr/0003-dual-write-strategy.md)
