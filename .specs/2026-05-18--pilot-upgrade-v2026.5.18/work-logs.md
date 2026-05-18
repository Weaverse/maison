# Work Logs — Pilot Upgrade v2026.5.18

## 2026-05-18 — @leehoang + Claude (Opus 4.7)

### Setup
- Branch created: `update/v1.0.0-to-v2026.5.18`
- Spec docs initialized at `.specs/2026-05-18--pilot-upgrade-v2026.5.18/`
- Audited Pilot (`/Users/leehoang/Weaverse/Work/workspace/pilot` @ `v2026.5.18`) vs Maison (`@weaverse/maison` `1.0.0`)
- Confirmed: Maison ≠ Pilot fork — sibling projects with divergent customizations
- 4-Epic plan approved by user; risk-ordered execution (bug fixes first)

### Decisions
- Skip Epic 4 (Refactors) — too risky vs current customizations
- Skip features in Tier C (payment icons, newsletter popup, font swap, theme types, shopify-account)
- Pending dev-lee changes (.gitignore, AGENTS.md, CLAUDE.md) left untouched per user instruction

### Starting: Epic 2 — Bug Fixes

#### Epic 2.5 — Sale badge on products without compare-at price ✅
- **Root cause:** `app/components/product/product-media.tsx` was passing `minVariantPrice` as `price` and `maxVariantPrice` as `compareAtPrice` to `SaleBadge`. For products with variants at different prices (e.g. $10–$30) but NO compare-at price, this falsely triggers `calculateDiscount` and renders a sale badge.
- **Fix (matches Pilot pattern):** Use `selectedVariant?.price` and `selectedVariant?.compareAtPrice` instead — same approach as Pilot `app/components/product-card/index.tsx:181-191`.
- **Files touched:**
  - `app/components/product/product-media.tsx` — both grid + slider SaleBadge usages, removed unused `priceRange` prop + destructure
  - `app/sections/main-product/index.tsx` — removed `priceRange={product?.priceRange}` prop pass
- **Verify:** typecheck passes for touched files (pre-existing unrelated error in `root.tsx:89` `<GlobalStyle>` ignored).

#### Epic 2.2 — ShopifyAnalytics `Cannot redefine property: Shopify` crash ✅
- **Root cause:** Hydrogen's `<ShopifyAnalytics>` (mounted via `<Analytics.Provider>`) calls `Object.defineProperty(window, 'Shopify', ...)`. If any prior script defines `window.Shopify` as a non-configurable property first, the call throws and the page crashes.
- **Fix (matches Pilot v2026.5.4 hotfix):** Inline a tiny `<script>` in `<head>` BEFORE everything else: `window.Shopify = window.Shopify || {};`. Plain assignment leaves the property `configurable: true`, so the later `defineProperty` succeeds.
- **Note:** Maison doesn't currently load `<shopify-account>` (the original Pilot trigger), but the defensive guard is harmless and prevents identical crashes if any other Maison integration (Judge.me embed, Klaviyo script, third-party Shopify scripts) ever locks down `window.Shopify`.
- **Files touched:** `app/root.tsx` — added script before `<link rel="stylesheet">` in `<head>`.

#### Epic 2.4 — Variant selector picking wrong variant in state-managed mode ✅
- **Root cause:** Old `<ProductOptionValues>` called `onVariantChange(firstSelectableVariant)` when in state-managed mode. `firstSelectableVariant` from `getProductOptions()` is computed for ONE option value alone — it doesn't preserve the user's currently-selected other options. Result: clicking "Red" while having "Size: M" selected jumps to "Red / S" (first available Red variant), not "Red / M".
- **Fix (matches Pilot PR #355):** Move variant resolution from `<ProductOptionValues>` to `<VariantSelector>`. New `handleOptionChange(optionName, value)`:
  1. Build `targetOptions` by merging the clicked option override into current `selectedOptions`.
  2. Find an exact-match variant in `variants` prop.
  3. Fall back to `firstSelectableVariant` only when no exact match exists (e.g., variant doesn't exist in the catalog).
- **API change:** `<ProductOptionValues>` prop renamed `onVariantChange(variant) → onOptionChange(name, value)`. Only consumer of the state-managed flow is `<VariantSelector>`; URL-mode consumers (`main-product/variants.tsx`) are unaffected because they pass neither prop.
- **Files touched:**
  - `app/components/product/variant-selector.tsx` — added `variants?` prop + `handleOptionChange`
  - `app/components/product/product-option-values.tsx` — renamed prop, simplified Select.Root + OptionValue button click handler
  - `app/sections/single-product/index.tsx` — pass `variants={getAdjacentAndFirstAvailableVariants(product)}` to `<VariantSelector>`

#### Epic 2.6 — Filters sidebar sticky positioning ✅
- **Root cause:** Sticky filter wrapper had no max-height and was only `sticky top-[calc(var(--height-nav)+40px)] space-y-4`. When the filter list grew taller than the viewport, the bottom of the sidebar fell off-screen with no way to scroll inside it; sticky also breaks when the content overflows past the parent.
- **Fix (matches Pilot v2026.3.23 pattern, native CSS only):** Bound the sticky wrapper to `h-[calc(100vh-var(--height-nav)-20px)]`, make it `flex flex-col`, and let it scroll internally with `overflow-y-auto`. Anchor with `top: calc(var(--height-nav))` flush below nav. Deliberately did NOT port Pilot's `<ScrollArea>` component to keep the diff minimal.
- **Files touched:** `app/sections/collection-filters/index.tsx`.

#### Epic 2.9 — Reset pagination params when filters/sorting change ✅
- **Root cause:** Filter and sort handlers preserved the stale `cursor`/`direction` query params from the previous result page. If a user was on page 3 of "All products" and switched the sort or applied a filter, the new URL still contained `?cursor=…&direction=next`, dropping them into a paginated state of the new result set with surprising/empty results.
- **Fix (matches Pilot pattern):** Added `clearPaginationParams(params)` helper in `app/utils/filter.ts` and call it inside `getFilterLink`, `getAppliedFilterLink`, sort dropdown, and `price-range-filter` handler.
- **Files touched:**
  - `app/utils/filter.ts` — new `clearPaginationParams` helper + integrated into `getFilterLink`/`getAppliedFilterLink`
  - `app/sections/collection-filters/sort.tsx` — clone params per sort key, clear cursor/direction
  - `app/sections/collection-filters/price-range-filter.tsx` — clear cursor/direction before navigate

#### Epic 2.3 — Optimistic cart not updating badge/title on add-to-cart ✅
- **Root cause:** `<CartDrawer>` rendered the badge count and drawer body directly inside `<Await>`. The resolved `cart` was the raw server promise value — `useOptimisticCart` was only called downstream inside `<Cart>`, so the trigger badge and drawer title kept showing the stale server count until a full re-fetch.
- **Fix (matches Pilot pattern, minimal version):** Extracted the drawer body into a child `<CartDrawerContent>` that wraps the resolved cart with `useOptimisticCart<CartApiQueryFragment>()`. The badge, title quantity, and free-shipping progress bar all consume the optimistic copy, so ATC immediately reflects in the header.
- **Note:** Did NOT port Pilot's full Zustand cart store refactor (`components/cart/store.ts`) — too invasive for Maison's current architecture. The lightweight `useOptimisticCart` wrapper covers the actual reported regression.
- **Files touched:** `app/components/layout/cart-drawer.tsx`.

### Epic 2 — Verification ✅
- `npm run typecheck` — only pre-existing unrelated error in `root.tsx:89` (`<NotFound type=…>` from commit `088dd06d`, untouched by this branch).
- `npm run build` — succeeds in 57.27s, all assets emitted.
- `npx biome check` on all 14 touched files — only pre-existing CRLF line-endings warning in `app/components/cart/cart-summary.tsx` (file committed with CRLF in `480b80c7`, pre-dates this branch). One formatting fix applied to `cart-drawer.tsx` (collapsed multi-line `<span>` into single line).
- All 7 actionable Epic 2 bug fixes (2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9) merged into branch with no regressions. Epic 2.7 deferred per plan.

#### Epic 2.8 — Window/SSR safe-guards (isBrowser checks) ✅
- **Root cause:** Two spots accessed `window` in code paths that can execute during SSR:
  1. `app/utils/misc.ts::constructURL()` — function body referenced `window.location.origin` unconditionally. Any server-side caller would crash before string-prefix branching.
  2. `app/hooks/use-weaverse-studio-check.ts` — hook body read `window.location.search` inside `if (isDesignMode === undefined && isIframe)`. The hook is used by global components (Header/Footer), so SSR enters that branch when `isDesignMode` is `undefined`.
- **Fix (matches Pilot v2026.4.20 commit `db1b032d`):** Import `isBrowser` from `@weaverse/hydrogen` and gate every direct `window`/`document` access on it.
  - `misc.ts`: `url.startsWith("/") && isBrowser ? \`${window.location.origin}${url}\` : url` — when SSR-called with a relative URL, falls through to `new URL(url)` (caller's responsibility to provide an absolute URL on the server).
  - `use-weaverse-studio-check.ts`: added `isBrowser` to the guard `if (isDesignMode === undefined && isBrowser && isIframe)`.
- **Sweep result:** Audited every remaining `window.`/`document.` reference under `app/`. All others are already safe — wrapped in `useEffect`, inside event handlers (`onClick`, `onChange`, subscribe callbacks), inside `if (isBrowser)` guards (e.g. `hero-video.tsx::getPlayerSize`, `blog-post.tsx`), or live in client-only entry files (`entry.client.tsx`, dangerously-set GTM script body).
- **Files touched:**
  - `app/utils/misc.ts` — add `isBrowser` import + guard
  - `app/hooks/use-weaverse-studio-check.ts` — add `isBrowser` import + guard
- **Verify:** typecheck clean (pre-existing unrelated `root.tsx:89 <NotFound>` error ignored).

#### Epic 2.7 — Media slider nav with variant grouping ⏭️ DEFERRED
- **Why deferred:** Pilot PR #359 fixes navigation in the variant-grouped media slider — but Maison does not yet have variant media grouping (Epic 3.8). Porting the fix now would touch `product-media.tsx` for behavior that has no consumer. Will revisit if/when Epic 3.8 is accepted.

#### Epic 2.1 — Stale checkout total when removing a cart line ✅
- **Root cause:** `<ItemRemoveButton>` submitted via `<CartForm>` with an anonymous fetcher. The only mount point holding that fetcher was the `<CartLineItem>` itself — which unmounts the instant the line is optimistically spliced out. React Router discarded the in-flight fetcher response, so the authoritative post-remove cart (including correct cost) never reached `useOptimisticCart`. The displayed total stayed frozen until the next mutation forced a refetch.
- **Fix (matches Pilot `74df2b3e`, adapted for Maison):** Give the form a stable `fetcherKey="cart-line-remove"` and read it from `<CartSummary>` (always mounted while the cart has items) via `useFetcher({ key: "cart-line-remove" })`. Include the fetcher state in `isCartUpdating` so the summary shows in-flight state during the transition. Maison already uses the identical pattern for discount-code and gift-card removal.
- **Note:** Did NOT port Pilot's `useCartFetcherSync` helper because that depends on the Zustand cart store refactor. Hydrogen's built-in `<CartForm>` action revalidates the root loader on completion, and `useOptimisticCart` then merges the fresh server cart — no manual sync required.
- **Files touched:**
  - `app/components/cart/cart.tsx` — add `fetcherKey="cart-line-remove"` to `<CartForm>`
  - `app/components/cart/cart-summary.tsx` — read keyed fetcher, include in `isCartUpdating`
