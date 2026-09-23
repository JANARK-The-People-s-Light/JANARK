# Development

## Prerequisites

- Node.js 22+
- Docker (Mongo for local / compose)
- Android Studio (optional) · Xcode 15+ (optional, iOS)

Env lives in the **repo root** `.env` (see `.env.example`). Prisma and `apps/web/next.config.ts` load it from there. Product/layout/ads values live under [`config/`](./configuration.md).

## Quick start

```bash
cp .env.example .env
# Set DATABASE_URL, MONGODB_URI, PHONE_HASH_SALT (≥24), and EXPOSE_DEV_OTP=1 for local OTP

npm run db:mongo          # or: docker compose up -d mongo
npm install
npm run db:push
npm run dev:web           # alias: npm run dev → http://localhost:3000
```

| Script | Purpose |
|--------|---------|
| `npm run dev:web` | Next.js dev server |
| `npm run build` | Production build (`@janark/web`) |
| `npm run typecheck` / `lint` | Web TS + ESLint |
| `npm run db:push` | Sync Prisma schema |
| `npm run db:demo` / `db:clear` | Seed / wipe both DBs |
| `npm run db:clear-rate-limits` | Clear OTP/write throttle buckets only |
| `npm run validate` | typecheck + smoke + features + telemetry + mobile + native |

Validators that hit HTTP need a running server (`BASE_URL`, default `http://localhost:3000`).

## Config while developing

- Edit `config/*.json` for copy, layout metrics, and rules — then refresh.
- Ads stay **off** until `NEXT_PUBLIC_ADS_ENABLED=true`. With ads on in dev, slots show placeholders (no AdSense script by default). See [ads.md](./ads.md).
- `next.config.ts` sets `experimental.externalDir` so the web app can import repo-root `config/`.

## Docker

```bash
docker compose up -d --build   # app :3000 + mongo
docker compose logs -f app
```

Compose uses `/data/janark.db`, uploads volume, and demo OTP (`EXPOSE_DEV_OTP`) suitable for **local verification only**. For real hosting see [SECURITY.md](../SECURITY.md).

## Mobile

| Client | Open | Default API base |
|--------|------|------------------|
| Android | `apps/android` in Android Studio | Emulator `http://10.0.2.2:3000` |
| iOS | `apps/ios/Janark.xcodeproj` | Simulator `http://127.0.0.1:3000` |

Point **Settings → Server** at your running origin. Origin allowlist must match `NEXT_PUBLIC_SITE_URL` (loopback aliases supported). Details: [mobile.md](./mobile.md).

## Backend note

`npm run dev:web` **is** the API. There is no separate Nest/Fastify process in the current cut.
