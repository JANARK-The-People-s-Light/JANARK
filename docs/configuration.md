# Configuration

Janark keeps business values, copy, layout metrics, and monetization **out of application code**. Change behavior by editing repo-root `config/` (and env), not by inventing literals in components.

Loader: `apps/web/src/lib/config` (`cfg`, `fill`, pillar accessors). Ads: `apps/web/src/config/ads`.

## Pillars (`config/`)

| File | Holds |
|------|--------|
| `sys.json` | Layout metrics, env key **names**, public links, paths, session/UA prefixes |
| `rules.json` | Feature flags, portal rail rules, feed thresholds, launch ISO date |
| `templates.json` | Brand, landing, portal UI copy tokens |
| `schema.json` | Config shape refs (Prisma remains the civic model SoT) |
| `fallbacks.json` | Values used only when a primary path is missing |

## Ads (`config/ads/`)

| File | Holds |
|------|--------|
| `providers.json` | AdSense / GAM / direct / house |
| `formats.json` | Leaderboard, rectangle, responsive sizes |
| `placements.json` | Placement keys, reserved heights, slot env names |
| `policy.json` | Enable env keys, feed insert index, ads.txt lines |
| `copy.json` | Labels and dev-placeholder strings |

Details: [ads.md](./ads.md).

## Procedure

1. Look up the setting in the matching pillar (or ads JSON).
2. Resolve env through names listed in `sys.envKeys` / ads `policy` — never hardcode host/ports/secrets.
3. On miss, use `fallbacks.json` (or ads policy defaults) — do not invent inline defaults at call sites.
4. Prefer editing JSON over changing control flow.

## Related

[architecture.md](./architecture.md) · [development.md](./development.md) · `.cursor/rules/zero-hardcoding.mdc`
