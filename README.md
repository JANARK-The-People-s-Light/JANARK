# Janark (जनार्क)

> The light of the people, for the people, by the people.

**Janark** is a **non-profit**, independent civic platform — not a government portal, not a party channel. Citizens browse freely; phone OTP is required only to post or react. Public identity is an **anonymity ID**, never a phone number.

**License:** [Apache License 2.0](LICENSE) · [NOTICE](NOTICE) · [Contributing](CONTRIBUTING.md)

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
4. Profile uses `anonId` (e.g. `/u/…`).

Local tip: set `EXPOSE_DEV_OTP=1` in `.env` so the OTP is returned in API responses during development.

---

## Environment

See [`.env.example`](.env.example). Minimum for local:

```env
DATABASE_URL="file:./prisma/dev.db"
MONGODB_URI="mongodb://127.0.0.1:27017/janark"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
PHONE_HASH_SALT="change-me-to-a-long-random-string"
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

Janark is open source under the **Apache License 2.0**. Please read:

| Doc | Purpose |
| --- | ------- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to develop, test, and open PRs |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [SECURITY.md](SECURITY.md) | Private vulnerability reporting |
| [SUPPORT.md](SUPPORT.md) | Where to ask for help |
| [LICENSE](LICENSE) · [NOTICE](NOTICE) | Apache 2.0 terms and attribution |

Prefer changes that:

1. Protect anonymity and reduce partisanship.
2. Keep ranking transparent and civic-oriented.
3. Stay fully dynamic for live civic data.

Questions about anonymity: in-app `/about`. Legal text: in-app `/terms`.

## License

Copyright 2026 JANARK - The People's Light and contributors.

Licensed under the Apache License, Version 2.0. You may not use this project except in compliance with the License. You may obtain a copy of the License at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an **"AS IS" BASIS**, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Attribution notices for redistributors are in [NOTICE](NOTICE).
