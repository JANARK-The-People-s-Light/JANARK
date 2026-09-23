# Contributing to Janark

Thank you for helping build a non-profit, non-partisan civic platform.

Janark’s source is public on GitHub under the [Business Source License 1.1](LICENSE).
Anyone may submit pull requests. By opening a PR or otherwise contributing, you
agree that your contribution is licensed to JANARK - The People's Light under
the same BSL 1.1 terms (and the Change License when it applies).

**Commercial use** and **public hosting** of Janark require separate written
permission — see [LICENSE](LICENSE) and [TRADEMARK.md](TRADEMARK.md). The
“JANARK” name and logo are reserved.

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
5. Put new copy, metrics, and flags in `config/` ([docs/configuration.md](docs/configuration.md)), not hardcoded in UI.

## Development setup

Follow [README.md](README.md) and [docs/development.md](docs/development.md):

```bash
npm run db:mongo
cp .env.example .env
npm install
npm run db:push
npm run db:clear && npm run db:demo   # optional
npm run dev:web
```

Local `npm run dev:web` is non-production use under BSL 1.1.

Docs index: [docs/README.md](docs/README.md) · config: [docs/configuration.md](docs/configuration.md) · ads: [docs/ads.md](docs/ads.md).

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

1. Fork the repo and create a branch from `main` (or the default branch).
2. Keep PRs focused — one concern per PR when practical.
3. Describe **why** the change matters for citizens or maintainers.
4. Note any env, migration, or demo-seed impact.
5. Do not commit secrets (`.env`, real phone hashes, API keys).

### Commit style

Short, imperative messages focused on intent, for example:

- `Fix mobile nav id for hamburger drawer`
- `Add Civic Trend Score ranking`
- `Document BSL 1.1 contributing process`

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

Please do **not** open public issues for vulnerabilities that could harm users.
See [SECURITY.md](SECURITY.md).

## License header (optional)

When adding substantial new source files, you may include:

```text
SPDX-License-Identifier: BUSL-1.1
```

## Questions

- Product & anonymity: [`/about`](https://github.com/JANARK-The-People-s-Light) · in-app `/about`
- Publishing rules: in-app `/terms`
- Licensing / hosting permission: org profile · [LICENSE](LICENSE) · [TRADEMARK.md](TRADEMARK.md)
- Org: [JANARK - The People's Light](https://github.com/JANARK-The-People-s-Light)
