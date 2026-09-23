# ADR-0001: Storage provider (SeaweedFS)

## Status

Accepted — 2026-07-23

## Context

Citizen media is written to `public/uploads` on the app filesystem and served via `/api/uploads/[filename]` (rewritten from `/uploads/...`). That works for a single Docker volume but does not scale across replicas, complicates backups, leaves orphan files hard to manage, and blocks CDN fronting.

## Decision

Introduce a `StorageProvider` abstraction under `apps/web/src/lib/object-storage/` and replace direct filesystem I/O in upload/serve routes.

1. **Public URLs stay** `/uploads/{key}` so the frontend and stored `mediaUrl` fields do not change.
2. **SQLite (and Mongo mirrors) store only the object key / public path**, never a SeaweedFS-internal fid.
3. **Default provider remains `local`** (current disk behavior) until SeaweedFS is enabled via config.
4. **SeaweedFS** (Filer HTTP API, S3-compatible later) is the target shared object store.
5. The app (or a reverse proxy) continues to **proxy reads** through `/uploads/*` so browsers never need SeaweedFS credentials.

## Consequences

- Shared media across app replicas once `STORAGE_PROVIDER=seaweedfs`.
- Docker volume `janark_uploads` becomes optional / migration-only.
- Future CDN can sit in front of the same URL pattern.
- Requires a compose service and cutover notes (follow-up PR).

## Alternatives considered

- Keep only local disk — rejected for multi-instance and ops reasons.
- Expose SeaweedFS URLs directly to clients — rejected; couples clients to storage and complicates auth/CDN.
- MinIO / cloud S3 only — SeaweedFS chosen for Apache-2.0, small footprint, single-binary ops; S3 API remains an option on the same provider interface.
