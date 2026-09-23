# Product

## Positioning

**Janark** — India's first open source social platform for civic action: raise issues, petitions, reports, votes, notices, shares, and memes; engage with the same rules on web and native.

Public launch target: **26 January 2027**. Until then, `/` is the marketing landing; the full product runs under `/unreleased` (and on native apps pointed at the API).

## Principles

1. **Citizen first** — Browse without an account; phone OTP only when writing.
2. **One civic square** — Same content and rules on web, Android, and iOS.
3. **Honest identity** — Public `anonId`; phone never shown; hash at rest.
4. **Action over vanity** — Feed cards drive engage / sign / vote, not empty social chrome.
5. **Open source** — Ship in the open; decisions recorded in ADRs.

## Marketing landing (`/`)

Structured product page (not a sparse splash):

1. Header — brand, About, Terms, Open Source badge, GitHub
2. Hero — launch badge, tagline, support copy, Preview CTA, civic illustration
3. Features — discuss, raise issues, petitions, reports, vote, discover
4. Contribution banner — contribute / feedback / share
5. Maintainers callout — apply via `/maintainers`
6. Footer — public launch date + links

Copy and metrics: `config/templates.json` · `config/sys.json` (landing) · `config/maintainers.json` (form). Component: `LandingPage`.

## Portal UX (short)

- Shell: fixed header; left nav + scrollable center + right trends rail (rails do not scroll with the feed).
- Create menu; browse lists; detail + comments; profile; settings; about; terms.
- Terms acceptance before write paths that require it.
- Optional ad placements when monetization is enabled ([ads.md](./ads.md)).
- Native apps mirror web capability, not pixel-perfect web chrome.

This file is the product source of truth for agents and contributors.
