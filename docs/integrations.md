# Maison third-party integration guide

This guide covers connecting third-party Shopify apps to Maison: which surfaces
exist in the theme, which credentials each one needs, where those credentials
live locally and on Oxygen, and what is safe to expose to the browser.

For local setup and the full environment variable table see
[`docs/setup.md`](setup.md). For section placement see
[`docs/sections.md`](sections.md).

> Maison ships two integrations wired end to end — Judge.me and Klaviyo — plus
> Shopify's own analytics and Google Tag Manager. Everything else in this guide
> describes the pattern to follow, not an integration that already exists in the
> theme. Sections labelled **Not built in** require theme work.

## 1. The security model

Maison runs on Shopify Oxygen, a server-side runtime. Every credential falls
into one of two categories, and the prefix is what decides it.

| Category | Prefix | Where it may appear | Examples |
| --- | --- | --- | --- |
| Public | `PUBLIC_` | Server and browser. Hydrogen serialises these into loader data and the page source. | `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, `PUBLIC_GOOGLE_GTM_ID` |
| Private | no prefix | Server only. Must never be returned from a loader or read in a component. | `JUDGEME_PRIVATE_API_TOKEN`, `KLAVIYO_PRIVATE_API_TOKEN`, `SESSION_SECRET` |

Three rules follow from this:

1. **Never prefix a private token with `PUBLIC_`.** The prefix is not a naming
   convention; it is what makes the value reach the browser.
2. **Never put a private token in a Weaverse theme setting or section setting.**
   Theme settings are read client-side through `useThemeSettings()`, so their
   values ship to the browser exactly like a `PUBLIC_` variable.
3. **Call private APIs from a route, not a component.** Maison's pattern is a
   dedicated resource route under `app/routes/` that reads `context.env`, calls
   the provider, and returns only the data the UI needs.

Maison also exposes a boolean-only summary of which integrations are configured.
`app/utils/root.server.ts` returns:

```ts
integrations: {
  klaviyo: Boolean(env.KLAVIYO_PRIVATE_API_TOKEN),
  judgeme: Boolean(env.JUDGEME_PRIVATE_API_TOKEN && env.PUBLIC_STORE_DOMAIN),
}
```

Booleans are safe to send to the browser; the tokens themselves are not. Follow
this pattern when adding an integration that needs to hide or show a surface.

### How to verify a token never leaks

For any integration you add, run all four checks:

1. View source on a page that uses the integration and search for the token.
2. Open DevTools → Network, reload, and search the document and every `.data`
   response for the token.
3. `grep -r "YOUR_TOKEN" build/` after `npm run build`.
4. Confirm the variable name has no `PUBLIC_` prefix and appears in no schema
   file under `app/sections` or `app/weaverse`.

## 2. Setting variables locally and on Oxygen

**Locally.** Copy the placeholder from `.env.example` into `.env`, which is
gitignored, and restart the dev server:

```bash
cp .env.example .env   # first time only
npm run dev
```

`.env.example` must contain placeholders only. Never commit a real value to it.

**On Oxygen.** Add the same variable names in the Shopify admin under
**Hydrogen → your storefront → Environments and variables**, for both Preview
and Production, then redeploy. Changing a variable does not update an existing
deployment; a new deployment is required.

**A caution about `env pull`.** `npx shopify hydrogen env pull` overwrites `.env`
with Shopify-managed values only. Weaverse and third-party keys are not
Shopify-managed and will be dropped. Restore them from your password or secret
manager, never from Git history.

## 3. Reviews

### Judge.me — built in

| | |
| --- | --- |
| **Surfaces** | `Judgeme reviews widget` section (product pages only) with its Reviews summary and Reviews list blocks; the `Stars rating` block inside Main product; the star rating on product cards |
| **Variables** | `JUDGEME_PRIVATE_API_TOKEN` (**private**), plus `PUBLIC_STORE_DOMAIN` which Maison uses to scope the shop |
| **Where to get the token** | Judge.me admin → **Settings → Integrations → Judge.me API**. Copy the private API token. |
| **Routes** | `app/routes/api/reviews.ts` handles both the review fetch and review submission. |

**Behaviour when unconfigured.** Maison fails closed rather than erroring. With
no token:

- `GET` returns `200` with an empty rating and an empty review list, so the
  product page renders normally and the widget shows its empty state.
- `POST` returns `503` with a generic message. The specific reason is logged
  server-side only; the browser never receives it.
- The Studio editor still shows the section so it can be designed before the
  token exists.

**Testing the unconfigured state.** Comment out `JUDGEME_PRIVATE_API_TOKEN` in
`.env`, restart `npm run dev`, and confirm a product page still renders with an
empty review state and no console error.

**Testing the configured state.** Set the token, restart, then open a product
that has reviews in Judge.me. Confirm the summary shows the correct average and
count, the list paginates, and a submitted review appears in the Judge.me admin.
Then run the four leak checks in section 1.

### Yotpo, Okendo, and Loox — not built in

None of these has a Maison surface. Two integration paths exist:

**App embed (fastest).** Most review apps offer a script-tag or app-embed
install. In a Hydrogen storefront there is no Online Store theme for the app to
inject into, so the script must be added to `app/root.tsx` yourself. The app's
public site or widget key is browser-safe; give it a `PUBLIC_` name.

**API integration (preferred).** Mirror the Judge.me pattern:

1. Add the private token to `.env` and `env.d.ts`, with no `PUBLIC_` prefix.
2. Create a resource route under `app/routes/api/` that reads `context.env` and
   calls the provider.
3. Add a `Boolean(...)` entry to the `integrations` object in
   `app/utils/root.server.ts`.
4. Build the section under `app/sections/` and register it in
   `app/weaverse/components.ts`.
5. Make the unconfigured path return an empty state, not an error.

| App | Credential to obtain | Type | Where |
| --- | --- | --- | --- |
| Yotpo | App key and secret | Private | Yotpo admin → Settings → Store settings |
| Okendo | Subscriber ID and API key | Subscriber ID public, API key private | Okendo admin → Settings → API |
| Loox | Public shop identifier | Public | Loox admin → Settings |

Only one review provider should be active at a time. Two star ratings on one
product card is the most common symptom of a half-finished migration.

## 4. Email, SMS, and back-in-stock

### Klaviyo — built in

| | |
| --- | --- |
| **Surfaces** | The `Newsletter` section and its Form block; the footer newsletter card; the newsletter popup |
| **Variables** | `KLAVIYO_PRIVATE_API_TOKEN` (**private**) |
| **Where to get the token** | Klaviyo → **Settings → Account → API keys → Private API keys**. Create a key with profile write access. A private key starts with `pk_`. |
| **Route** | `app/routes/($locale).api.klaviyo.ts`, which posts to `https://a.klaviyo.com/api/profiles` |

**Behaviour when unconfigured.** The newsletter surfaces are hidden on the
storefront. They remain visible in Studio so a merchant can still design them.
This is driven by the `integrations.klaviyo` boolean, not by the token itself.

**Behaviour on submission.**

- A new email creates a profile and returns `201`.
- An email already on the list returns Klaviyo's `duplicate_profile` error,
  which Maison treats as success — the visitor is subscribed either way.
- Any other failure returns a generic message to the browser. The provider's
  own error text is logged server-side only.

**Testing the unconfigured state.** Comment out `KLAVIYO_PRIVATE_API_TOKEN`,
restart the dev server, and confirm the footer card and popup are absent from
the storefront but still present in Studio.

**Testing the configured state.** Set the token, restart, submit a new address,
and confirm the profile appears in Klaviyo → Profiles. Submit the same address
again and confirm the UI still reports success. Then run the four leak checks.

**Common failure.** A `401 authentication_failed` from Klaviyo means the key
does not exist in any Klaviyo account — usually a typo, a truncated paste, or a
key that has been revoked. A valid key belonging to a different account would
succeed and write the profile into that other account, so a `401` is never a
wrong-account symptom.

### Back-in-stock — not built in

Maison has no back-in-stock surface. Klaviyo's back-in-stock feature needs a
subscribe call against a variant ID and a trigger point on the product page when
the selected variant is sold out. Add it as a resource route following the
Klaviyo pattern above and a block inside Main product.

### Attentive — not built in

Attentive uses a public tag for on-site collection and a private API key for
server-side subscription. If only the on-site creative is needed, add the tag in
`app/root.tsx` with a `PUBLIC_` variable. If subscriptions are posted from
Maison, use a private key in a resource route.

## 5. Subscriptions

### Shopify selling plans — built in

Maison renders subscription options natively from Shopify's selling plan groups.
The `Subscription selector` block inside Main product reads
`product.sellingPlanGroups` and renders nothing when a product has none. No
third-party credential is involved.

Any subscription app that writes real Shopify selling plans — Shopify
Subscriptions, and the standard configurations of Recharge, Skio, and Appstle —
therefore works with no theme change. Confirm the app is creating selling plans
rather than only its own records.

### Recharge, Skio, and Appstle — checkout considerations

| App | Credential | Type | Note |
| --- | --- | --- | --- |
| Recharge | Storefront access token | Public | Only needed for Recharge's own checkout flow. Selling-plan mode needs nothing. |
| Skio | Public API key | Public | Selling-plan based. |
| Appstle | API key | Private | Selling-plan based. |

Checkout is hosted by Shopify, so a subscription app that operates through
Shopify checkout needs no Maison change. An app that replaces checkout with its
own flow requires custom work and should be scoped separately.

## 6. Wishlist — not built in

Maison has no wishlist. This is a deliberate gap, not an oversight; it was
recorded as out of scope during the integration-readiness work.

Two approaches:

- **Customer-account based.** Store the wishlist as a customer metafield through
  the Customer Account API. Requires `/account` to be working — see
  [`docs/setup.md`](setup.md) section 4.
- **App based.** Wishlist apps generally provide a public site key plus a script.
  Add the script in `app/root.tsx` and the site key as a `PUBLIC_` variable.

Either way you will need a new block for the product card and Main product, both
registered in `app/weaverse/components.ts`.

## 7. Loyalty and referral — not built in

Maison has no loyalty surface.

Loyalty apps split cleanly along the public/private line:

- The on-site widget uses a **public** site or token ID and can go in
  `app/root.tsx` behind a `PUBLIC_` variable.
- Point balances, redemption, and referral attribution use a **private** API
  key and must go through a resource route.

LoyaltyLion is the provider the sibling Aspen theme integrates, using a public
site ID plus a private API key. Maison declares neither variable; add both if
the integration is brought over.

## 8. Search, filter, and merchandising

Maison uses Shopify's native Storefront API for search and filtering. There is
no third-party dependency.

| Surface | Implementation |
| --- | --- |
| Search results | `app/routes/($locale).search.tsx`, rendered entirely from code |
| Predictive search | `app/routes/($locale).api.predictive-search.ts` |
| Collection filtering and sort | The `Collection filters` section, product filters from the Storefront API |

Two constraints matter before scoping a search app:

- `/search` never calls `weaverse.loadPage()`, so it cannot be edited in Weaverse
  Studio. Changing it is a code change.
- Replacing search with a third-party provider means replacing that route's
  loader, not adding a section.

Swatch and colour merchandising is driven by Shopify metaobjects rather than an
app. `METAOBJECT_COLORS_TYPE` names the metaobject type; the section reads it
through `app/utils/root.server.ts`.

## 9. Analytics and pixels

### Shopify analytics — built in

`app/root.tsx` wraps the app in `<Analytics.Provider>`, and routes emit the
matching view events: `Analytics.ProductView`, `CollectionView`, `SearchView`,
and `CartView`. No credential is needed beyond the storefront connection.

### Google Tag Manager — built in

| | |
| --- | --- |
| **Variable** | `PUBLIC_GOOGLE_GTM_ID` — **public**, a container ID such as `GTM-XXXXXXX`. Browser-safe by design. |
| **Where to get it** | Google Tag Manager → container → Container ID |
| **Implementation** | `app/utils/root.server.ts` exposes it as `googleGtmID`; `app/components/root/custom-analytics.tsx` pushes commerce events onto `window.dataLayer`. |

Omit the variable to disable GTM entirely. Because a container ID is public, it
is the one analytics credential that legitimately carries the `PUBLIC_` prefix.

### Shopify Web Pixels and other pixels

Custom pixels configured in Shopify admin run in Shopify's own sandbox and need
no theme change. A pixel that must run in the page — Meta, TikTok, Pinterest —
uses a public ID and belongs in `app/root.tsx` with a `PUBLIC_` variable. A
Conversions API integration uses a **private** access token and must run
server-side in a resource route; never place a CAPI token in a theme setting.

### Shopify Inbox

`PUBLIC_SHOPIFY_INBOX_SHOP_ID` is declared in `env.d.ts` and listed in
`.env.example`, but no component renders the chat widget. Setting it currently
does nothing. Adding the widget to `app/root.tsx` is the remaining work.

## 10. Adding a new integration — checklist

- [ ] Decide public or private, and name the variable accordingly.
- [ ] Add a placeholder line to `.env.example`. Never a real value.
- [ ] Declare it in `env.d.ts` **at the point code starts reading it**, not
      before.
- [ ] Read it from `context.env` inside a loader or resource route, never in a
      component.
- [ ] If a UI surface must be hidden when unconfigured, add a `Boolean(...)`
      entry to `integrations` in `app/utils/root.server.ts` and gate on that.
- [ ] Make the unconfigured path return an empty state, not an error.
- [ ] Return generic error text to the browser; log the provider's message
      server-side.
- [ ] Drain any response body you do not read — see the troubleshooting note
      below.
- [ ] Add the variable to Oxygen Preview and Production, then redeploy.
- [ ] Test both the configured and unconfigured states.
- [ ] Run the four leak checks from section 1.
- [ ] Document the integration in this file.

## 11. Troubleshooting

### A token works locally but not on Oxygen

Oxygen variables are per-environment and are baked into a deployment. Confirm
the variable exists in the environment being tested, then redeploy. Editing a
variable does not update a deployment that already exists.

### `The script will never generate a response`

A `fetch()` response whose body is never read keeps the request's I/O context
alive in workerd, and the worker never completes. Any early return that skips
reading the body must drain it first:

```ts
if (res.ok) {
  await res.body?.cancel();
  return data({ ok: true }, 201);
}
```

Maison hit this in both the Klaviyo and Judge.me routes. Apply the same drain in
any new integration route.

### A surface is hidden even though the token is set

- Restart the dev server. Environment values resolve when the server starts.
- Confirm the variable name matches exactly, including the absence of a
  `PUBLIC_` prefix.
- Check the `integrations` boolean the surface gates on. Judge.me requires
  `PUBLIC_STORE_DOMAIN` as well as its token.

### A surface shows in Studio but not on the storefront

This is intended for gated integrations. Studio shows the section so it can be
designed before credentials exist. Verify on the storefront preview, not in the
Studio canvas.

### `401` from a provider

The key does not exist at that provider. Check for a truncated paste, trailing
whitespace, or a revoked key. A valid key belonging to a different account would
succeed and write to that account instead, so `401` never indicates a
wrong-account problem.

### A private token appears in page source

Something is exposing it. In order of likelihood: the variable was given a
`PUBLIC_` prefix; it was returned from a loader; it was placed in a Weaverse
theme or section setting; or it is read directly in a component. Rotate the
token first, then fix the cause.

## Related documentation

- [`docs/setup.md`](setup.md) — environment variables, local setup, deployment
- [`docs/sections.md`](sections.md) — where each surface appears in Studio
- [Weaverse documentation](https://weaverse.io/docs)
- [Hydrogen environment variables](https://shopify.dev/docs/storefronts/headless/hydrogen/environment-variables)
