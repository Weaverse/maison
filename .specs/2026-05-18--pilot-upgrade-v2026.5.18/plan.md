# Plan — Pilot Upgrade to v2026.5.18

## Execution order (RISK-ORDERED, safest first)

1. **Epic 2 — Critical Bug Fixes** 🟢 LOW RISK → DO FIRST
2. **Epic 3 — New Features (selective port)** 🟡 MEDIUM RISK
3. **Epic 1 — Dependency Bumps** 🔴 HIGH RISK
4. **Epic 4 — Refactors** 🔵 OPTIONAL / DEFERRED

Each epic = its own commit(s) on `update/v1.0.0-to-v2026.5.18`. Build + typecheck must pass after each epic before advancing.

---

## Epic 2 — Critical Bug Fixes (DO FIRST)

| # | Fix | Pilot ref | Maison files affected | Status |
|---|---|---|---|---|
| 2.1 | Stale checkout total when removing cart line | `74df2b3e` (v2026.5.18) | `app/components/cart/cart.tsx`, `app/components/cart/cart-summary.tsx` | ✅ done |
| 2.2 | ShopifyAnalytics `Cannot redefine property: Shopify` crash | v2026.5.4 hotfix | `app/root.tsx` (`<head>` script) | ✅ done |
| 2.3 | Optimistic cart not updating badge/title on add-to-cart | PR #374 (v2026.4.15) | `app/components/layout/cart-drawer.tsx` | ✅ done |
| 2.4 | Variant selector using wrong variant when managed via state | PR #355 (v2026.3.23) | `app/components/product/variant-selector.tsx`, `app/components/product/product-option-values.tsx`, `app/sections/single-product/index.tsx` | ✅ done |
| 2.5 | Incorrect sale badge on products without compare-at price | PR #340 (v2026.3.23) | `app/components/product/product-media.tsx`, `app/sections/main-product/index.tsx` | ✅ done |
| 2.6 | Filters sidebar sticky positioning | v2026.3.23 | `app/sections/collection-filters/index.tsx` | ✅ done |
| 2.7 | Media slider nav when grouping enabled | PR #359 (v2026.3.31) | `app/components/product/product-media.tsx` | pending |
| 2.8 | window/SSR safe-guards (isBrowser checks) | v2026.4.20 | `app/utils/misc.ts`, `app/hooks/use-weaverse-studio-check.ts` | ✅ done |
| 2.9 | Reset pagination params when filters/sorting change | v2026.4.10 | `app/utils/filter.ts`, `app/sections/collection-filters/sort.tsx`, `…/price-range-filter.tsx` | ✅ done |

**Verification after Epic 2:** `npm run typecheck && npm run build`

---

## Epic 3 — New Features (Selective Port)

Each feature = standalone commit. Skip features that conflict with Maison customizations.

### Tier A — High value, low conflict (recommended)

| # | Feature | Pilot ref | Notes |
|---|---|---|---|
| 3.1 | ScrollReveal component | v2026.3.23 | Standalone — port `app/components/scroll-reveal.tsx` |
| 3.2 | Global border-radius theme setting | v2026.4.10 | Add to `app/weaverse/schema.server.ts` + Tailwind config |
| 3.3 | Show more/less toggle for product media grid | v8.1.0 | Modify `app/components/product/product-media.tsx` |
| 3.4 | Configurable load-more (infinite scroll vs button) | v2026.3.23 | Modify `app/sections/collection-filters/*` |
| 3.5 | "Show more" toggle for collection filter groups | v2026.3.23 | Modify filter components |

### Tier B — Larger but high value (review carefully)

| # | Feature | Pilot ref | Notes |
|---|---|---|---|
| 3.6 | Sticky Add-to-Cart bar | v2026.4.15 | New section/component, mobile optimized — verify B2B compat |
| 3.7 | Buy Now button | v2026.4.15 | Modify `app/components/product/add-to-cart-button.tsx` |
| 3.8 | Variant Media Grouping (filename matching) | v8.1.0 | Modify `app/components/product/product-media.tsx` + schema |
| 3.9 | Product Availability with animated ping | v2026.4.10 | Replace/augment `app/sections/main-product/product-stock.tsx` — CAREFUL |
| 3.10 | Product Highlights / Estimated Delivery / Promo Text | v2026.4.10 | New main-product child sections — register in weaverse/components.ts |
| 3.11 | 3D Model Viewer + ExternalVideo media support | v2026.3.31 | Modify `app/components/product/product-media.tsx`, MEDIA_FRAGMENT |
| 3.12 | Multi-type search (tabbed: products/collections/articles/pages) | v2026.3.31 | Modify `app/routes/($locale).api.predictive-search.ts`, predictive-search component |
| 3.13 | Language variants for multi-lingual countries | v2026.5.18 | Modify country selector + i18n logic |
| 3.14 | Country selector group by country, sort by name | v2026.5.18 | Modify country selector |

### Tier C — SKIP (Maison already has equivalent or conflicts)

| # | Feature | Reason to skip |
|---|---|---|
| ❌ | Payment method icons configuration | Maison already has — was just simplified in current dev-lee |
| ❌ | Newsletter popup type/position settings | Maison has `app/components/newsletter-popup.tsx` already |
| ❌ | `<shopify-account>` web component | Decide later — Maison Customer Account flow may be customized |
| ❌ | ThemeSettings TypeScript types | Maison schema differs — would require complete rewrite |
| ❌ | Refactor Playfair → Newsreader font | Maison brand decision — keep current font |

---

## Epic 1 — Dependency Bumps (HIGH RISK — DO AFTER FEATURES)

Order: bump in groups, build after each group.

### Group 1A — Minor/safe bumps
- `react` 19.1.1 → 19.2.6
- `react-dom` 19.1.1 → 19.2.6
- `@types/react` 19.1.13 → 19.2.14
- `@types/react-dom` 19.1.9 → 19.2.3
- `@react-router/dev` ^7.9.1 → 7.14.2
- `react-router` ^7.9.1 → 7.14.2
- `tailwindcss` ^4.1.13 → ^4.3.0
- `@tailwindcss/vite` ^4.1.13 → ^4.3.0
- `@tailwindcss/forms` 0.5.10 → 0.5.11
- `@tailwindcss/typography` 0.5.18 → 0.5.19
- `@biomejs/biome` ^2.2.4 → ^2.4.15
- `@weaverse/biome` 5.4.1 → 5.7.4
- `tailwind-merge` 3.3.1 → 3.6.0
- `react-share` 5.2.2 → 5.3.0
- `react-intersection-observer` 9.16.0 → 10.0.3
- `@shopify/cli` 3.84.2 → ^3.94.3

### Group 1B — Major bumps (one at a time, test after each)
- `@weaverse/hydrogen` ^5.7.1 → ^5.13.0 (6 minor releases of features)
- `@shopify/hydrogen` ^2025.7.0 → ^2026.4.2 (3 majors — read migration guide!)
- `@shopify/hydrogen-react` (add new dependency if needed)
- `@shopify/mini-oxygen` 3.2.1 → ^4.1.0 (1 major)
- `react-player` 2.16.0 → ^3.4.0 (1 major, ESM interop — check `video-embed`)

### Group 1C — Vite v8 (RISKIEST, isolate)
- `vite` 6.3.5 → ^8.0.13 (2 majors)
- Migrate to native tsconfigPaths resolver
- Remove obsolete `react`/`react-dom` path aliases from `tsconfig.json`
- Remove stale `typographic`/`textr` from SSR `optimizeDeps`
- Update `vite.config.ts` for any breaking config changes

**Verification after each group:** `npm install && npm run typecheck && npm run build`

---

## Epic 4 — Refactors (OPTIONAL — DEFERRED)

These are nice-to-have but **high-risk** with current customizations. Consider doing in separate PR(s) later or skip entirely.

| # | Refactor | Risk |
|---|---|---|
| 4.1 | `collection-filters/` → `main-collection/` folder (Pilot pattern) | 🔴 Maison just updated this in recent commits |
| 4.2 | `hero-video.tsx` → `hero-video/` folder (types/styles/utils) | 🟡 Maison single-file works fine |
| 4.3 | `product-media.tsx` → `product-media/` folder modular split | 🟡 Useful but invasive |
| 4.4 | Create `product-card/` folder with quick-shop | 🟡 Maison `quick-shop.tsx` just modified |
| 4.5 | Create `product-grid/` with Zustand store | 🟡 Need to check if Maison wants client state pattern |
| 4.6 | Drop redundant ref forwarding (React 19 pattern) | 🟡 Touches every section component |
| 4.7 | Semantic h1-h6 heading tags | 🟢 Low risk, just a sweep |
| 4.8 | Section gap CSS variables 2px steps | 🟢 Theme settings change |
| 4.9 | Split `app.css` into theme/keyframes/utilities | 🟢 Cosmetic file split |

**Recommendation:** Defer Epic 4 entirely. Revisit only if needed for future feature work.

---

## Files Touched (Scope Map)

### By Epic 2 (Bug fixes)
- `app/components/cart/cart.tsx`, `app/components/cart/*`
- `app/components/layout/header.tsx`
- `app/components/product/badges.tsx`
- `app/components/product/variant-selector.tsx`
- `app/components/product/product-media.tsx`
- `app/entry.server.tsx`
- `app/sections/main-product/product-variant-selector.tsx`
- `app/sections/collection-filters/*`

### By Epic 3 (New features)
- `app/components/scroll-reveal.tsx` (new)
- `app/components/product/product-media.tsx`
- `app/components/product/add-to-cart-button.tsx`
- `app/components/layout/country-selector*`
- `app/components/layout/predictive-search/*`
- `app/routes/($locale).api.predictive-search.ts`
- `app/sections/main-product/*` (new: highlights, availability, etc.)
- `app/sections/collection-filters/*`
- `app/sections/sticky-atc/*` (new)
- `app/weaverse/schema.server.ts`
- `app/weaverse/components.ts`
- `app/graphql/fragments.ts` (MEDIA_FRAGMENT for 3D model)

### By Epic 1 (Deps)
- `package.json`, `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`

### By Epic 4 (Refactors — skip)
- Many files — see release notes

---

## Files NEVER Touched (Protected — Maison customizations)

- `app/components/b2b/*`
- `app/sections/b2b-signup/*`
- `app/sections/variant-list/*` (just refactored)
- `app/sections/judgeme-reviews/*` + `app/utils/judgeme.ts`
- `app/sections/ali-reviews/*`
- `app/routes/($locale).api.klaviyo.ts`
- `app/sections/main-product/product-prices.tsx` (just added "From" prefix)
- `app/sections/main-product/product-stock.tsx` (Maison-only, augment only — don't replace)
- `app/sections/main-product/product-subscription-selector.tsx`
- `app/sections/main-product/product-atc-buttons.tsx`
- `app/components/product/quick-shop.tsx` (just modified)
- `app/components/layout/footer.tsx` (just simplified)
- `app/components/newsletter-popup.tsx` (Maison-only)
- Sections: `accordion`, `articles`, `company-story`, `contact-form`, `featured-collections`, `hotspots`, `image-gallery`, `logo-list`, `multicolumn`, `our-team`, `promotion-grid`, `related-articles`, `single-product`, `slideshow`, `video-embed`, `countdown` — all Maison-only

---

## Safety Rules

1. **Commit per task, not per epic** — easy to bisect/revert
2. **Build + typecheck must pass** after each commit
3. **NEVER touch protected files** unless explicitly approved
4. **When in doubt, ASK** before modifying customized components
5. **Test in browser** for cart/checkout/variant-selector changes (Phase 7)
6. **Rollback strategy:** `git reset --hard origin/dev-lee` if anything goes wrong

## Verification Per Epic

```bash
npm run typecheck    # MUST pass
npm run biome        # MUST pass
npm run build        # MUST pass
npm run dev          # Smoke test in browser
```

## Progress Tracking

All progress logged in `work-logs.md`. TodoWrite mirrors current task in agent context.
