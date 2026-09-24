# Contributing to Janark

Thank you for helping build a non-profit, non-partisan civic platform.

Janark’s source is public on GitHub under the [Business Source License 1.1](LICENSE).
By opening a PR or otherwise contributing, you agree that your contribution is
licensed to JANARK - The People's Light under the same BSL 1.1 terms (and the
Change License when it applies).

**Commercial use** and **public hosting** require separate written permission —
see [LICENSE](LICENSE) and [TRADEMARK.md](TRADEMARK.md). The “JANARK” name and
logo are reserved.

## Ways to contribute

- **Code** — features, bug fixes, tests, accessibility, performance
- **Docs** — handbook, product, ADRs
- **Design** — clearer civic UX without clutter or partisan framing
- **Issues** — clear bug reports and proposals (what, why, how to reproduce)

Prefer changes that:

1. Protect anonymity (no phone numbers in public UI or logs).
2. Keep the platform non-partisan and civic-oriented.
3. Stay transparent about ranking, moderation, and terms.
4. Keep live civic pages dynamic (no stale static civic data).
5. Put new copy, metrics, and flags in `config/` ([docs/handbook.md § Configuration](docs/handbook.md#6-configuration)), not hardcoded in UI.

## Development setup

Follow [README.md](README.md) and [docs/handbook.md § Local development](docs/handbook.md#8-local-development):

```bash
npm run db:mongo
cp .env.example .env
npm install
npm run db:push
npm run db:clear && npm run db:demo   # optional
npm run dev:web
```

Before opening a PR:

```bash
npm run typecheck
npm run lint
npm run build
# optional (dev server running):
npm run validate:mobile
npm run validate:native
```

## Pull requests

1. Fork and branch from `main`.
2. Keep PRs focused — one concern when practical.
3. Describe **why** the change matters for citizens or maintainers.
4. Note any env, migration, or demo-seed impact.
5. Do not commit secrets (`.env`, real phone hashes, API keys).

Short, imperative commit messages focused on intent.

## Help

- **How Janark works** (anonymity, browse-free): in-app `/about`
- **Publishing rules**: in-app `/terms` · `apps/web/src/lib/civic-post-terms.ts`
- **Bugs / features**: GitHub Issues — include expected vs actual, steps, OS/browser, whether you used `npm run db:demo`
- **Security**: [SECURITY.md](SECURITY.md) — do not file public issues for vulnerabilities
- **Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Org**: [JANARK - The People's Light](https://github.com/JANARK-The-People-s-Light)

## License header (optional)

```text
SPDX-License-Identifier: BUSL-1.1
```
