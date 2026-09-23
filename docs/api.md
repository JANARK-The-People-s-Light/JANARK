# API

All clients use the Next.js App Router under `apps/web/src/app/api/**`.

**One** public HTTP API — do not add a parallel civic backend for mobile.

## Catalog

| Area | Paths |
|------|--------|
| Auth | `/api/auth/phone/request`, `/api/auth/phone/verify`, `/api/auth/me`, `/api/auth/logout` |
| Maintainers | `/api/maintainers` (POST — public application) |
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
| Telemetry / share | `/api/telemetry/visit`, `/api/social/share` |

## Contracts

- **Authoritative validation** is in route handlers (terms, anti-bot, ownership).
- Android `Dtos.kt` / iOS `Models.swift` track JSON shapes; OpenAPI export is planned (M3).
- Prefer additive changes. Breaking changes need coordinated web + mobile notes.

## Writes

Most create paths: Prisma (canonical) → best-effort Mongo feed mirror (`mirrorFeedCard`) → activity/trends. Session cookie + Origin/Referer required for authenticated writes. Native apps skip Turnstile when User-Agent is `Janark-Android/` / `Janark-iOS/`.

## Non-JSON surfaces

| Path | Role |
|------|------|
| `/ads.txt` | Ad sellers list (not under `/api`) — [ads.md](./ads.md) |
| `/maintainers` | Public maintainer application form |
