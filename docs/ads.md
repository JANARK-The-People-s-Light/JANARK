# Ads & monetization

Config-driven ad slots. Layout components only render `<AdSlot placement="…" />`; providers, sizes, labels, and env wiring live under `config/ads/`.

**Default: off.** Set `NEXT_PUBLIC_ADS_ENABLED=true` plus publisher/slot IDs to serve live units.

## Architecture

```text
layout.tsx
  └─ <AdSenseScript />          # script once (lazyOnload); skipped in dev unless policy says otherwise
pages / shell
  └─ <AdSlot placement="…" />   # reserves height (CLS), then provider DOM + adsbygoogle.push
config/ads/*.json               # providers · formats · placements · policy · copy
/ads.txt                        # sellers list (route handler)
```

| Layer | Path |
|-------|------|
| External JSON | `config/ads/` |
| Typed runtime | `apps/web/src/config/ads` |
| Components | `apps/web/src/components/ads/` (`AdSlot`, `AdSenseScript`, providers) |
| Types | `apps/web/src/types/ads.d.ts` |

## Placements

| Key | Where |
|-----|--------|
| `home-top` | Portal home (`HomeTrending`) |
| `feed-top` | Discussions feed |
| `feed-middle` | After N posts (`policy.feedMiddleAfterIndex`) |
| `sidebar` | Right rail (`PortalRightPanel`) |
| `post-bottom` | Detail pages (share, petition, report, issue, vote, meme, public `/p`) |
| `mobile-bottom` | Defined; disabled by default |

Each placement has `reservedHeight` (px) so space is reserved before creatives load.

## Providers

| Id | Role |
|----|------|
| `adsense` | Programmatic (`<ins class="adsbygoogle">`) |
| `house` | Internal promo (e.g. GitHub) when configured |
| `direct` | Direct-sold placeholder surface |
| `gam` | Reserved (off) |

## Env (see `.env.example`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_ADS_ENABLED` | Master switch (`true` / `1`) |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | `ca-pub-…` |
| `NEXT_PUBLIC_ADSENSE_SLOT_*` | Per-placement slot IDs (names in `placements.json`) |
| `ADS_TXT_LINES` | Optional multiline override for `/ads.txt` |

## Dev behavior

- With ads enabled in development, slots show **placeholders** (copy from `config/ads/copy.json`) and do **not** load the AdSense script unless `policy.loadScriptInDev` is true.
- Coming-soon `/` does not show ads (`policy.showOnComingSoon`).

## CSP

Middleware allows AdSense script/frame/connect hosts when the app runs. Do not remove those directives if monetization is used in production.

## Related

[configuration.md](./configuration.md) · [architecture.md](./architecture.md)
