# Architecture Decision Records

Durable decisions for Janark’s data plane. Product/roadmap: [../product.md](../product.md). Technical handbook: [../handbook.md](../handbook.md).

| ADR | Title | Status |
|-----|--------|--------|
| [0001](./0001-storage-provider.md) | Storage provider (SeaweedFS) | Accepted — local default; SeaweedFS ready |
| [0002](./0002-search-index.md) | Search index (Meilisearch) | Accepted — not running yet |
| [0003](./0003-dual-write-strategy.md) | Dual-write strategy (Mongo) | Accepted — live |

## Implementation sequence

1. **Storage abstraction** (landed): `apps/web/src/lib/object-storage` — `STORAGE_PROVIDER` (`local` default).
2. **SeaweedFS ops**: compose service + production cutover; keep `/uploads/...` URLs.
3. **Search abstraction**: Meilisearch + indexer hooks ([ADR-0002](./0002-search-index.md)).
4. **Search usage**: global + feed search replacing `$regex` / `contains`.
5. Later: PostgreSQL SoT option; re-evaluate Mongo retention ([ADR-0003](./0003-dual-write-strategy.md)).
