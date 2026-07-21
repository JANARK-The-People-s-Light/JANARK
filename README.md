# Janark (जनार्क)

> The light for us, by us.

**Janark** is a **non-profit**, independent civic platform — not a government portal, not a party channel. Citizens browse freely; phone OTP is required only to post or react. Public identity is an **anonymity ID**, never a phone number.

**License:** [Business Source License 1.1](LICENSE) · [NOTICE](NOTICE) · [Trademark](TRADEMARK.md) · [Contributing](CONTRIBUTING.md)

Stack: **Next.js** (App Router) · **SQLite / Prisma** · **MongoDB / Mongoose** · **Tailwind**.

---

## Principles

- **Browse free, act with OTP** — login appears only when posting, voting, commenting, or flagging.
- **Non-partisan by design** — publishing requires accepting [Civic Posting Terms](/terms): posts must serve public betterment (judiciary, governance, education, health, and related civic topics), not promote any political party or candidate. **Janark is not responsible for user-generated content**; each publisher is solely responsible for what they post.
- **Trending ≠ most likes** — the home square uses a **Civic Trend Score** (velocity, discussion quality, diversity, freshness, trust).
- **Fully dynamic** — civic pages use `force-dynamic` / `no-store`; no static cache of live civic data.

---

## Dual database

| Store | Role |
| ----- | ---- |
| **SQLite (Prisma)** | Issues, proposals, votes, notices, reports, demands, memes, engagement votes/comments, content flags, phone identities |
| **MongoDB (Mongoose)** | Feed posts, discussions, trends, activity stream, platform counters |

Writes that matter to the public square usually land in **both** (SQLite row + Mongo feed card).

---

## Quick start

```bash
# 1. MongoDB (Docker)
npm run db:mongo

# 2. Env
cp .env.example .env
# Set at least: DATABASE_URL, MONGODB_URI, PHONE_HASH_SALT
# Optional for local OTP debugging: EXPOSE_DEV_OTP=1

# 3. Install + schema
npm install
npx prisma db push
npx prisma generate

# 4. Demo data (optional) or empty seed
npm run db:clear && npm run db:demo
# or: npm run db:seed

# 5. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Next.js dev server |
| `npm run db:mongo` | Start / create `janark-mongo` on `:27017` |
| `npm run db:demo` | Seed rich demo content |
| `npm run db:clear` | Wipe SQLite + Mongo collections |
| `npm run db:seed` | Lighter seed |
| `npm run build` | Prisma generate + production build |

---

## Docker hosting

The repo ships a production **Dockerfile** and **docker-compose.yml** (app + MongoDB).

```bash
# Build & run (app on http://localhost:3000, Mongo internal)
docker compose up -d --build

# Logs
docker compose logs -f app

# Stop
docker compose down
```

Compose sets production secrets defaults suitable for **local verification only**. For a real deploy, override at least:

- `PHONE_HASH_SALT`, `HUMAN_TOKEN_SECRET`, `IP_HASH_SALT` (≥24 random chars)
- `NEXT_PUBLIC_SITE_URL` (your public HTTPS origin — rebuild after changing)
- OTP SMS (`TWILIO_*` or `MSG91_*`) and unset `ALLOW_OTP_WITHOUT_SMS`
- Prefer Postgres instead of SQLite for multi-instance deploys

Persistent volumes: SQLite (`janark_sqlite`), uploads (`janark_uploads`), Mongo (`janark_mongo`).

Verified locally: image builds, Prisma syncs on boot, `/`, `/unreleased`, and `/api/feed` return HTTP 200.

---

## Product surface

| Path | What it does |
| ---- | ------------ |
| `/` | Compact hero + **trending** feed with location / type / hashtag filters |
| `/feed` | Open square — start discussions |
| `/explore` | Browse by location |
| `/demands`, `/demands/new` | Public demands |
| `/reports`, `/reports/new` | Civic reports (problems, crime, issues) |
| `/memes`, `/memes/new` | Memes (image / GIF / video via URL) |
| `/issues`, `/issues/new` | Structured issues |
| `/vote/new`, `/vote/[id]` | Proposals & voting |
| `/notice/new` | Notices |
| `/u/[anonId]` | Public anonymity profile |
| `/about` | How anonymity works |
| `/terms` | Civic Posting Terms & Conditions |
| `/dashboard` | Live stats & trends |

**Engagement (everywhere):** upvote · downvote · comment · reply · report/flag. Comments allow **GIFs only** (link paste behind “Add a GIF”).

**Homepage sorts:** Trending · Momentum · Hot · Newest (`civic-trend-v1`).

---

## Auth & anonymity

1. User browses without login.
2. On publish / react, OTP modal opens.
3. Phone is hashed (`PHONE_HASH_SALT`); never shown publicly.
4. Session is an **httpOnly** cookie — phone hashes are not stored in the browser.
5. Profile uses `anonId` (e.g. `/u/…`).

Local tip: set `EXPOSE_DEV_OTP=1` in `.env` so the OTP is returned in API responses during development. **Never** enable this in production.

---

## Public hosting (security)

Before going live, follow the checklist in [SECURITY.md](SECURITY.md):

- Strong unique salts (`PHONE_HASH_SALT`, `HUMAN_TOKEN_SECRET`, `IP_HASH_SALT`)
- Real `MONGODB_URI` + `NEXT_PUBLIC_SITE_URL` (HTTPS)
- OTP SMS via Twilio or MSG91
- Optional Cloudflare Turnstile for OTP
- Prefer Postgres over SQLite for multi-instance deploys

Production refuses to start if defaults / `EXPOSE_DEV_OTP` are still set.

---

## Environment

See [`.env.example`](.env.example). Minimum for local:

```env
DATABASE_URL="file:./prisma/dev.db"
MONGODB_URI="mongodb://127.0.0.1:27017/janark"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
PHONE_HASH_SALT="change-me-to-a-long-random-string"
HUMAN_TOKEN_SECRET="change-me-to-a-long-random-string"
IP_HASH_SALT="change-me-to-a-long-random-string"
EXPOSE_DEV_OTP=1
```

Optional social posting keys (X / Meta / WhatsApp) are documented in `.env.example`.

---

## Architecture notes

- **Civic Posting Terms** — versioned in `src/lib/civic-post-terms.ts`; UI: `PostTermsAccept`; enforced on create APIs via `acceptedTerms` + `termsVersion`.
- **Trending** — `src/lib/trending.ts` ranks feed candidates by momentum and discussion quality, not raw vote totals.
- **Unified engagement** — `EngagementVote` / `EngagementComment` in Prisma; UI via `EngageBar`, `CommentThread`, `FeedEngage`.
- **Location filters** — feed API facets + cascading country → state → district → city/town on the home filter overlay.

---

## Contributing

Janark’s source is **public on GitHub** under the **Business Source License 1.1**.
Anyone can submit PRs. **Commercial use** and **public hosting** need written
permission. The **JANARK** name and logo are reserved — see [TRADEMARK.md](TRADEMARK.md).

Please read:

| Doc | Purpose |
| --- | ------- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to develop, test, and open PRs |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [SECURITY.md](SECURITY.md) | Private vulnerability reporting |
| [SUPPORT.md](SUPPORT.md) | Where to ask for help |
| [LICENSE](LICENSE) · [NOTICE](NOTICE) | BSL 1.1 terms |
| [TRADEMARK.md](TRADEMARK.md) | JANARK name and logo |

Prefer changes that:

1. Protect anonymity and reduce partisanship.
2. Keep ranking transparent and civic-oriented.
3. Stay fully dynamic for live civic data.

Questions about anonymity: in-app `/about`. Legal text: in-app `/terms`.

## License

Copyright 2026 JANARK - The People's Light and contributors.

Licensed under the **Business Source License 1.1**. You may use the source for
non-production purposes (including local development and contributions).
Commercial use and hosting require a separate license from the Licensor.
On the Change Date in [LICENSE](LICENSE), the Change License named there
applies to that version.

See [LICENSE](LICENSE), [NOTICE](NOTICE), and [TRADEMARK.md](TRADEMARK.md).
