# Janark

> India's open-source platform for civic participation. Independent civic discussion, petitions, reports, and community voting — built in the open.

**Janark** is not a government portal or party channel. Citizens browse freely; phone OTP is required only to post or react. Public identity is an **anonymity ID**, never a phone number.

**Public launch:** 26 January 2027 · Until then: marketing `/`, full portal under `/unreleased`, native apps against `/api/*`.

**License:** [Business Source License 1.1](LICENSE) · [NOTICE](NOTICE) · [Trademark](TRADEMARK.md) · [Contributing](CONTRIBUTING.md)

Stack: **Next.js** (App Router) · **SQLite / Prisma** · **MongoDB / Mongoose** · **Tailwind** · **Android Compose** · **iOS SwiftUI**.

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/handbook.md](docs/handbook.md) | Architecture, data, auth, API, telemetry, config, ads, local run, mobile contract |
| [docs/product.md](docs/product.md) | Product intent + roadmap |
| [docs/adr/](docs/adr/README.md) | Durable decisions |
| [SECURITY.md](SECURITY.md) | Vulnerabilities + production checklist |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute & get help |

## Repo layout

| Path | Role |
|------|------|
| `apps/web` | Next.js portal + API (`@janark/web`) |
| `apps/android` | Kotlin Compose thin client |
| `apps/ios` | SwiftUI thin client |
| `prisma/` | Schema + migrations (repo root) |
| `packages/` | Reserved for shared TS libs (M3+) |
| `config/` | External sys / rules / templates · `config/ads/` |
| `docs/` | Handbook, product, ADRs |

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
| `npm run dev:web` | Next.js (alias: `npm run dev`) — this **is** the API |
| `npm run db:mongo` / `db:push` / `db:demo` / `db:clear` | Data plane |
| `npm run build` / `typecheck` / `lint` | Ship gates |
| `npm run validate` | Full validator suite (server required for HTTP checks) |

Details: [docs/handbook.md](docs/handbook.md#8-local-development).

```bash
docker compose up -d --build   # local verification only
```

Production checklist: [SECURITY.md](SECURITY.md).

## Surfaces

| Path | Role |
|------|------|
| `/` | Marketing landing (launch 26 Jan 2027) |
| `/unreleased/*` | Full portal preview |
| `/api/*` | JSON API (web + Android + iOS) |
| `/ads.txt` | Ad sellers file (when ads configured) |

Ads are **off by default**. Auth: phone OTP → httpOnly `janark_sid`; phone hashed; public `anonId` only.

## Mobile

| App | Path |
|-----|------|
| Android | [apps/android/README.md](apps/android/README.md) |
| iOS | [apps/ios/README.md](apps/ios/README.md) |

Shared contract: [docs/handbook.md § Mobile](docs/handbook.md#9-mobile).

## License

Copyright 2026 JANARK - The People's Light and contributors.

Licensed under the **Business Source License 1.1**. Non-production use (local dev / contributions) is allowed. Commercial use and hosting need a separate license. See [LICENSE](LICENSE), [NOTICE](NOTICE), and [TRADEMARK.md](TRADEMARK.md).
