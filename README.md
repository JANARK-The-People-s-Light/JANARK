# Janark

> India's first open source social platform. Independent civic discussion, petitions, reports, and community voting — built in the open.

**Janark** is not a government portal or party channel. Citizens browse freely; phone OTP is required only to post or react. Public identity is an **anonymity ID**, never a phone number.

**Public launch:** 26 January 2027 · Until then: marketing `/`, full portal under `/unreleased`, native apps against `/api/*`.

**License:** [Business Source License 1.1](LICENSE) · [NOTICE](NOTICE) · [Trademark](TRADEMARK.md) · [Contributing](CONTRIBUTING.md)

Stack: **Next.js** (App Router) · **SQLite / Prisma** · **MongoDB / Mongoose** · **Tailwind** · **Android Compose** · **iOS SwiftUI**.

## Repo layout

| Path | Role |
|------|------|
| `apps/web` | Next.js portal + API (`@janark/web`) |
| `apps/android` | Kotlin Compose thin client |
| `apps/ios` | SwiftUI thin client |
| `prisma/` | Schema + migrations (repo root) |
| `packages/` | Reserved for shared TS libs (M3+) |
| `config/` | External sys / rules / templates · `config/ads/` |
| `docs/` | [Documentation index](docs/README.md) |

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/README.md](docs/README.md) | Index |
| [architecture](docs/architecture.md) · [configuration](docs/configuration.md) · [ads](docs/ads.md) | System + config + monetization |
| [development](docs/development.md) · [api](docs/api.md) | Local run + API |
| [authentication](docs/authentication.md) · [database](docs/database.md) · [mobile](docs/mobile.md) | Auth, data, clients |
| [product](docs/product.md) · [roadmap](docs/roadmap.md) · [adr/](docs/adr/README.md) | Product + next work |

## Principles

- **Browse free, act with OTP** — login only when posting, voting, commenting, or flagging.
- **Non-partisan by design** — publishing requires [Civic Posting Terms](/terms); Janark is not responsible for UGC.
- **Trending ≠ most likes** — Civic Trend Score (velocity, discussion quality, diversity, freshness, trust).
- **One API** — web and native share `/api/*`; SQLite is SoT, Mongo mirrors the public feed.

## Quick start

```bash
npm run db:mongo
cp .env.example .env
# DATABASE_URL, MONGODB_URI, PHONE_HASH_SALT (≥24); EXPOSE_DEV_OTP=1 for local OTP

npm install
npm run db:push
npm run db:clear && npm run db:demo   # optional
npm run dev:web                       # http://localhost:3000
```

| Script | Purpose |
|--------|---------|
| `npm run dev:web` | Next.js (alias: `npm run dev`) |
| `npm run db:mongo` / `db:push` / `db:demo` / `db:clear` | Data plane |
| `npm run build` / `typecheck` / `lint` | Ship gates |
| `npm run validate` | Full validator suite (server required for HTTP checks) |

More: [docs/development.md](docs/development.md).

## Docker

```bash
docker compose up -d --build
docker compose logs -f app
```

Compose is for **local verification**. Production checklist: [SECURITY.md](SECURITY.md).

## Product surface

| Path | Role |
|------|------|
| `/` | Marketing landing (launch 26 Jan 2027) |
| `/unreleased/*` | Full portal preview |
| `/api/*` | JSON API (web + Android + iOS) |
| `/ads.txt` | Ad sellers file (when ads configured) |

Portal routes (under `/unreleased` until launch): home feed, create (issue / petition / report / vote / share / notice / meme), browse lists, profiles, settings, about, terms, dashboard.

Ads are **off by default**; see [docs/ads.md](docs/ads.md).

## Auth

Phone OTP → httpOnly `janark_sid`. Phone hashed at rest; public `anonId` only. Local: `EXPOSE_DEV_OTP=1`. Details: [docs/authentication.md](docs/authentication.md).

## Mobile

| App | Path |
|-----|------|
| Android | [apps/android/README.md](apps/android/README.md) |
| iOS | [apps/ios/README.md](apps/ios/README.md) |

Guide: [docs/mobile.md](docs/mobile.md).

## Contributing

| Doc | Purpose |
|-----|---------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Develop, test, PRs |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |
| [SUPPORT.md](SUPPORT.md) | Help |
| [LICENSE](LICENSE) · [NOTICE](NOTICE) · [TRADEMARK.md](TRADEMARK.md) | Legal |

## License

Copyright 2026 JANARK - The People's Light and contributors.

Licensed under the **Business Source License 1.1**. Non-production use (local dev / contributions) is allowed. Commercial use and hosting need a separate license. See [LICENSE](LICENSE), [NOTICE](NOTICE), and [TRADEMARK.md](TRADEMARK.md).
