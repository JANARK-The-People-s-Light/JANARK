# Contributing to Janark

Thank you for helping build a non-profit, non-partisan civic platform.

Janark is licensed under the [Apache License 2.0](LICENSE). By submitting a pull request or other contribution, you agree that your contribution is licensed under the same terms (see Apache 2.0 §5).

## Ways to contribute

- **Code** — features, bug fixes, tests, accessibility, performance
- **Docs** — README, setup guides, architecture notes, translations
- **Design** — clearer civic UX without clutter or partisan framing
- **Issues** — clear bug reports and proposals (what, why, how to reproduce)

Prefer changes that:

1. Protect anonymity (no phone numbers in public UI or logs).
2. Keep the platform non-partisan and civic-oriented.
3. Stay transparent about ranking, moderation, and terms.
4. Keep live civic pages dynamic (no stale static civic data).

## Development setup

Follow the Quick start in [README.md](README.md):

```bash
npm run db:mongo
cp .env.example .env
npm install
npx prisma db push
npx prisma generate
npm run db:clear && npm run db:demo   # optional
npm run dev
```

Before opening a PR:

```bash
npx tsc --noEmit
npm run lint
npm run build
# optional mobile checks (dev server running):
npm run validate:mobile
```

## Pull requests

1. Fork the repo and create a branch from `main` (or the default branch).
2. Keep PRs focused — one concern per PR when practical.
3. Describe **why** the change matters for citizens or maintainers.
4. Note any env, migration, or demo-seed impact.
5. Do not commit secrets (`.env`, real phone hashes, API keys).

### Commit style

Short, imperative messages focused on intent, for example:

- `fix mobile nav id for hamburger drawer`
- `Add Civic Trend Score ranking`
- `Document Apache 2.0 contributing process`

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

Please do **not** open public issues for vulnerabilities that could harm users.
See [SECURITY.md](SECURITY.md).

## License header (optional)

When adding substantial new source files, you may include the Apache 2.0 SPDX identifier:

```text
SPDX-License-Identifier: Apache-2.0
```

Or the short Apache boilerplate from the [LICENSE](LICENSE) appendix.

## Questions

- Product & anonymity: [`/about`](https://github.com/JANARK-The-People-s-Light) · in-app `/about`
- Publishing rules: in-app `/terms`
- Org: [JANARK - The People's Light](https://github.com/JANARK-The-People-s-Light)
