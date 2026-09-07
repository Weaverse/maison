# Maison setup and usage guide

This guide is the operational reference for developers, interns, and merchants
working on Maison. It covers a fresh local setup, Shopify and Weaverse
connections, customization, validation, and deployment to Shopify Oxygen.

## 1. What Maison is

Maison is a Shopify Hydrogen theme for premium bedding, home goods, and B2B
wholesale storefronts. It ships with B2B pricing, company locations, a bulk
variant order table, and quote-style checkout alongside the usual D2C flows.

The application has two customization layers:

1. **Code:** developers maintain React Router routes, Hydrogen commerce logic,
   reusable components, and Weaverse section schemas in this repository.
2. **Weaverse Studio:** merchants compose pages, reorder sections, select
   Shopify resources, edit content, and change global theme settings without
   editing code.

Shopify remains the source of truth for products, collections, markets,
customers, companies, menus, checkout, and orders. Weaverse is the source of
truth for page composition and theme-setting values.

## 2. Prerequisites

Install or obtain:

- Node.js **22.12.0 or newer** (`node --version`)
- npm, which is included with Node (`npm --version`)
- Git (`git --version`)
- access to a Shopify store with the Hydrogen or Headless sales channel
- access to the corresponding Weaverse project
- Shopify CLI authentication when linking, pulling env values, or deploying

Maison tracks `package-lock.json`; use npm and `npm ci` for reproducible
installs. Do not add a second lockfile — `npm run clean` removes stray
`pnpm-lock.yaml` for this reason.

Oxygen is available through Shopify's Hydrogen sales channel. A development
store works for development, although its Oxygen deployment URLs are private
and require a store login.

## 3. Install locally

```bash
git clone <repository-url> maison
cd maison
npm ci
cp .env.example .env
```

Generate a unique session secret for your machine:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the generated output in `SESSION_SECRET` in `.env`. `.env.example` ships
with a throwaway value; never keep it, and never reuse the production secret
locally.

Populate the four minimum values below and start the app:

```bash
npm run dev
```

Open <http://localhost:3456>. The command runs React Router type generation,
Shopify GraphQL codegen, and Hydrogen's local MiniOxygen runtime.

### Minimum values needed to render

```env
SESSION_SECRET="<random-64-character-hex-string>"
PUBLIC_STORE_DOMAIN="<store>.myshopify.com"
PUBLIC_STOREFRONT_API_TOKEN="<public-storefront-token>"
WEAVERSE_PROJECT_ID="<weaverse-project-id>"
```

Product and collection pages plus Weaverse content render with these values.
Checkout, customer accounts, B2B pricing, analytics, and optional integrations
need the additional variables below.

## 4. Environment variables

### Security model

- `.env` is for local development only and is ignored by Git.
- `.env.example` holds names and placeholders only. It must never contain a
  usable token.
- Oxygen variables are configured separately for **Preview**, **Production**,
  and any custom environment. A local `.env` is not uploaded by a Git push.
- A `PUBLIC_*` prefix means the value may participate in storefront
  configuration and may reach browser code. It is not a statement that the
  value is safe to publish anywhere.
- Private tokens stay server-only: read them from `context.env` inside a
  loader, action, or API route. Never add `PUBLIC_` to a private token to make
  it reachable from the browser, and never return a provider's error payload to
  the client.
- Weaverse theme settings are sent to the browser. A private credential must
  never be stored as a theme or section setting.
- `WEAVERSE_PROJECT_ID`, storefront IDs, shop IDs, and public client IDs are
  identifiers, not passwords. `WEAVERSE_API_KEY` is a private credential.
- If a private token leaks, rotate it at the provider and update every affected
  Oxygen environment.

### Core Shopify and Weaverse variables

| Variable | Required | Exposure | Placeholder | Purpose/source |
| --- | --- | --- | --- | --- |
| `SESSION_SECRET` | Yes | **Private** | `<random-64-character-hex-string>` | Signs Hydrogen session cookies. Generate a separate value for local, Preview, and Production. |
| `PUBLIC_STORE_DOMAIN` | Yes | Public identifier | `<store>.myshopify.com` | Store domain from the Hydrogen/Headless sales channel. Not a custom storefront domain. |
| `PUBLIC_STOREFRONT_API_TOKEN` | Yes | Public token | `<public-storefront-token>` | Public Storefront API token issued by Shopify. |
| `PRIVATE_STOREFRONT_API_TOKEN` | Recommended in production | **Private** | `<private-storefront-token>` | Server-side Storefront API token. Oxygen normally provisions it. |
| `WEAVERSE_PROJECT_ID` | Yes | Public identifier | `<weaverse-project-id>` | Weaverse Studio → Project settings, or the project URL. |
| `WEAVERSE_API_KEY` | No for normal rendering | **Private** | `<weaverse-api-key>` | Authenticated Weaverse operations. Also read by the B2B signup route. |
| `WEAVERSE_HOST` | No | Configuration | `https://studio.weaverse.io` | Set only for an approved custom or staging Weaverse host. |
| `WEAVERSE_API_BASE` | No | Configuration | `https://api.weaverse.io` | Optional custom Weaverse API base; omit for normal Studio. |

### Shopify checkout, accounts, and analytics

| Variable | Required | Exposure | Placeholder | Purpose/source |
| --- | --- | --- | --- | --- |
| `PUBLIC_CHECKOUT_DOMAIN` | For checkout | Public identifier | `<store>.myshopify.com` | Domain used for Shopify checkout and CSP configuration. |
| `PUBLIC_STOREFRONT_ID` | For complete analytics | Public identifier | `<hydrogen-storefront-id>` | Hydrogen storefront ID used by Shopify analytics. |
| `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` | For `/account` and B2B | Public client ID | `<customer-account-client-id>` | Customer Account API settings in the Hydrogen/Headless channel. |
| `SHOP_ID` | For customer accounts | Public identifier | `<shop-id>` | Shop identifier used by Hydrogen's Customer Account client. |
| `PUBLIC_GOOGLE_GTM_ID` | No | Public identifier | `GTM-XXXXXXX` | Google Tag Manager container ID. Omit to skip GTM entirely. |

B2B pricing, company locations, and quantity rules come from the Customer
Account API buyer context, so `/account` must work before B2B behaviour can be
verified.

### Optional Maison integrations

| Variable | Exposure | Placeholder | Feature |
| --- | --- | --- | --- |
| `JUDGEME_PRIVATE_API_TOKEN` | **Private** | `<judgeme-private-api-token>` | Judge.me ratings, review list, and review submission. |
| `KLAVIYO_PRIVATE_API_TOKEN` | **Private** | `<klaviyo-private-api-token>` | Newsletter signup in the footer and the popup. |
| `METAOBJECT_COLORS_TYPE` | Configuration | `<shopify-metaobject-type>` | Shopify metaobject type used for colour and image swatches. |
| `CUSTOM_COLLECTION_BANNER_METAFIELD` | Configuration | `<namespace.key>` | Collection metafield used for custom banner media. |

Both integrations fail closed. With no token the storefront still renders:
reviews show an empty state and the newsletter surfaces are hidden. See
`docs/integrations.md` for provider setup and behaviour.

### Reserved names

These names appear in `.env.example` or `env.d.ts` but no code in `app/` reads
them yet. They are kept so the intent is not lost, and listed here so nobody
spends time obtaining values for them.

| Variable | What it is for |
| --- | --- |
| `ALI_REVIEWS_API_KEY` | Reserved for Ali Reviews. The section reads its key from a Weaverse setting rather than the environment, and is not registered in `app/weaverse/components.ts`. |
| `HEADLESS_B2B_HOST` | Reserved for a standalone headless B2B service. The B2B signup route posts to `WEAVERSE_HOST` with `WEAVERSE_API_KEY` instead. |
| `HEADLESS_B2B_TOKEN` | Auth token for the same reserved service. |
| `PUBLIC_SHOPIFY_INBOX_SHOP_ID` | Reserved for the Shopify Inbox chat widget. Declared in `env.d.ts`, but no component renders the widget yet. |

`METAOBJECT_COLOR_NAME_KEY` and `METAOBJECT_COLOR_VALUE_KEY` are declared in
`env.d.ts` but unset and unread; `app/utils/root.server.ts` uses
`METAOBJECT_COLORS_TYPE` alone. Declare a variable in `env.d.ts` at the point
code starts reading it, not before.

## 5. Connect Maison to Shopify

### Recommended: Hydrogen sales channel and Shopify CLI

Use this path for stores that will deploy to Oxygen.

1. Install the [Hydrogen sales channel](https://apps.shopify.com/hydrogen).
2. Create a Hydrogen storefront, or connect this repository to an existing one.
3. Authenticate and link the local repository:

   ```bash
   npx shopify hydrogen link
   ```

4. Pull Shopify-managed variables:

   ```bash
   npx shopify hydrogen env pull
   ```

5. Re-add or verify `SESSION_SECRET`, `WEAVERSE_PROJECT_ID`, and the
   integration tokens after the pull. The CLI can overwrite `.env`, and Shopify
   knows nothing about Weaverse or third-party values.
6. Run `npm run codegen`, restart `npm run dev`, then verify products,
   collections, cart, and checkout.

The current CLI reference is at <https://shopify.dev/docs/api/shopify-cli/hydrogen>.

### Development store or external hosting: Headless sales channel

If the Hydrogen channel is not used, install the
[Headless sales channel](https://apps.shopify.com/headless), create Storefront
API credentials, and enter the values manually in `.env`:

- `PUBLIC_STORE_DOMAIN`
- `PUBLIC_STOREFRONT_API_TOKEN`
- `PRIVATE_STOREFRONT_API_TOKEN` when server-side private access is available
- Customer Account API values when `/account` or B2B pricing must work

Do not put Shopify Admin API tokens in the Storefront API variables. Maison
does not need an Admin API token to render the storefront.

### Customer Account API during local development

Customer Account OAuth requires approved callback, origin, and logout URLs, and
does not authenticate against bare `localhost`. Use the helper command:

```bash
npm run dev:ca
```

Follow the Shopify CLI prompts for the development URL. If your setup needs it,
expose port 3456 through a stable HTTPS tunnel and register these URLs in the
Customer Account API application settings:

```text
Callback:   https://<development-domain>/account/authorize
Origin:     https://<development-domain>
Logout:     https://<development-domain>
```

Never add a temporary developer URL to the production account configuration
without coordinating with the team.

## 6. Connect and use Weaverse Studio

1. Install the [Weaverse app](https://apps.shopify.com/weaverse) and open the
   Maison project in Weaverse Studio.
2. Copy the project ID from Project settings into `WEAVERSE_PROJECT_ID`.
3. Start Maison with `npm run dev`.
4. In Studio, open **Project settings → Manage URLs / Preview URLs** and add:

   ```text
   http://localhost:3456
   ```

   Include the protocol, use `localhost` rather than `127.0.0.1`, and omit the
   trailing slash.
5. Select the local URL in Studio and confirm the preview connects and renders.

If Studio cannot reach localhost in your environment, use the same HTTPS tunnel
as customer-account development and register that URL instead.

`WEAVERSE_API_KEY` is not needed to edit pages in Studio or to render published
content.

### How page content reaches the storefront

- A route calls `context.weaverse.loadPage({ type, handle })` for its page type.
- `validateWeaverseData()` in `app/weaverse/index.tsx` throws a 404 when the
  page is missing, then `<WeaverseContent />` renders the returned tree.
- Available sections and blocks are registered in `app/weaverse/components.ts`.
- A component that is not registered cannot be added in Studio.

Routes wired to Weaverse and their page types:

| Route | Page type |
| --- | --- |
| `($locale)._index.tsx` | `INDEX`, or `CUSTOM` for a root-level handle |
| `($locale).products.$productHandle.tsx` | `PRODUCT` |
| `($locale).products._index.tsx` | `ALL_PRODUCTS` |
| `($locale).collections.$collectionHandle.tsx` | `COLLECTION` |
| `($locale).collections._index.tsx` | `COLLECTION_LIST` |
| `($locale).pages.$pageHandle.tsx` | `PAGE` |
| `($locale).blogs.$blogHandle._index.tsx` | `BLOG` |
| `($locale).blogs.$blogHandle.$articleHandle.tsx` | `ARTICLE` |
| `($locale).$.tsx` | `CUSTOM` (catch-all for merchant-created pages) |

Merchant-created pages are covered: a Shopify page such as `/pages/reseller`
loads through `pages.$pageHandle.tsx` as `PAGE`, and anything else resolves
through the catch-all as `CUSTOM`. `/search` is the one route with a full UI
that never calls `loadPage`, so it renders entirely from code and cannot be
edited in Studio.

## 7. Customize Maison

### Merchant workflow in Studio

Use Studio for changes that should not require a deployment:

1. Select the page or template.
2. Add, remove, or reorder sections.
3. Select Shopify products, collections, blogs, or media.
4. Edit section content and layout settings.
5. Open **Theme settings** for typography, colours, buttons, cards, badges,
   forms, page width, spacing, header, and footer.
6. Check the desktop and mobile previews.
7. Publish when ready.

Publishing content is not the same as deploying code: Studio publishes content
for the Weaverse project, while Oxygen deploys the React application.

### Developer workflow

| Change | Primary location |
| --- | --- |
| Global setting definitions and defaults | `app/weaverse/schema.server.ts` |
| Theme setting values mapped to CSS variables | `app/weaverse/style.tsx` |
| Base fonts and global CSS | `app/styles/app.css` |
| Reusable storefront UI | `app/components/` |
| Weaverse sections, child blocks, loaders, presets | `app/sections/` |
| Component registration | `app/weaverse/components.ts` |
| Route data and actions | `app/routes/` |
| GraphQL fragments and queries | `app/graphql/` |

When adding a Weaverse section:

1. Create the component and `createSchema()` definition in `app/sections/`.
2. Spread Weaverse's root props (`...rest`) onto the rendered root element.
3. Add clear groups, labels, defaults, presets, and mobile behaviour.
4. Register the namespace export in `app/weaverse/components.ts`.
5. Verify insertion and editing in Studio, not only direct rendering.
6. Update `docs/sections.md`.

Changing a `defaultValue` in a schema affects **newly added instances only**. A
theme or section that already stores a value keeps it; the saved value must be
changed in Studio.

## 8. Validate changes

Run the complete pre-PR set:

```bash
npm run biome
npm run typecheck
npm run routes-check
npm run build
```

For changes that touch GraphQL documents:

```bash
npm run codegen
```

For visual or interactive changes:

```bash
npm run e2e
```

`npm run preview` builds and serves the production bundle locally, which
catches differences between the dev server and the Oxygen build.

`npm run biome:fix` applies safe lint and format fixes. The repository carries
pre-existing warnings; check that your files are clean rather than expecting a
zero total.

## 9. Deploy to Shopify Oxygen

### GitHub continuous deployment (recommended)

1. Push Maison to a GitHub repository.
2. In Shopify Admin → Hydrogen, create a storefront and connect the repository.
3. Shopify opens a pull request adding the Oxygen GitHub workflow. Review and
   merge it; do not remove its storefront-ID marker.
4. In **Storefront settings → Environments and variables**, configure Preview
   and Production separately.
5. Keep Shopify's read-only variables. Add `WEAVERSE_PROJECT_ID`, a unique
   `SESSION_SECRET`, and the integration tokens needed in that environment.
6. Run the pre-PR checks locally and push the branch. Non-production branches
   deploy to Preview; the configured production branch deploys to Production.
7. Verify the Oxygen URL, checkout, account login, content, analytics, and
   integrations.
8. Publish the Hydrogen storefront, attach the custom domain, and add the
   production URL as a Weaverse Preview URL.

Oxygen deployments and their variable values are immutable. After adding,
changing, or rotating a variable, create a new deployment — an existing one
will not pick up the new value.

References:

- <https://shopify.dev/docs/storefronts/headless/hydrogen/deployments/github>
- <https://shopify.dev/docs/storefronts/headless/hydrogen/environments>
- <https://docs.weaverse.io/oxygen-deployment>

### Manual or custom CI deployment

For an already linked storefront:

```bash
npx shopify hydrogen deploy
npx shopify hydrogen deploy --preview
```

Custom CI must store the Oxygen deployment token as the protected secret
`SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN`. It belongs in the CI secret store, not in
`.env.example`, browser code, or repository files.

Pushing changes under `.github/workflows/` requires a token with the `workflow`
scope; an OAuth token without it is rejected.

## 10. Troubleshooting

### `SESSION_SECRET environment variable is not set`

Generate a random value, add it to `.env`, and restart `npm run dev`. Oxygen
needs a separate value per environment.

### Products, collections, or menus are empty / Storefront API returns 401

- Confirm `PUBLIC_STORE_DOMAIN` uses `<store>.myshopify.com`.
- Pull fresh values with `npx shopify hydrogen env pull`.
- Confirm Storefront API permissions cover the resources being queried.
- Restart the dev server after changing `.env`.

### GraphQL or generated TypeScript errors

Run `npm run codegen`, then `npm run typecheck`. If codegen fails, fix the
Shopify connection and credentials before editing generated `.d.ts` files.

### Port 3456 is already in use

Stop the previous Hydrogen process first. The Studio preview URL is registered
for port 3456, so letting the CLI switch ports silently leaves Studio pointing
at the wrong server. Find the process with `lsof -ti:3456`.

### Weaverse preview is blank or disconnected

- Confirm `WEAVERSE_PROJECT_ID` belongs to the intended Studio project.
- Use `http://localhost:3456`, with a protocol, no trailing slash, and
  `localhost` rather than `127.0.0.1`.
- Confirm `npm run dev` is still running on port 3456.
- Disable browser privacy or shield features for the Studio and preview domains
  if they block iframes or websockets.

### A section does not appear in Studio

Confirm it exports a schema and is registered in `app/weaverse/components.ts`.
Also check the schema's `enabledOn` page types and any per-page limit.

### Studio changes do not appear on Oxygen

- Confirm Oxygen uses the same `WEAVERSE_PROJECT_ID` as Studio.
- Confirm the change was published, not only previewed.
- Add the Oxygen or custom-domain URL to Weaverse Preview URLs.
- Redeploy after changing Oxygen variables.

### Customer login redirects fail locally

Bare localhost is not a valid Customer Account OAuth origin. Run
`npm run dev:ca`, use an HTTPS development domain, and verify the callback,
origin, and logout URLs in Shopify's Customer Account API settings.

### Checkout does not open from localhost

Confirm the cart has a valid Shopify checkout URL and that
`PUBLIC_CHECKOUT_DOMAIN` came from the same connected storefront. Checkout is
hosted by Shopify and does not stay on localhost.

### Reviews or newsletter surfaces are missing

Both integrations fail closed. Without `JUDGEME_PRIVATE_API_TOKEN` the review
list returns an empty state; without `KLAVIYO_PRIVATE_API_TOKEN` the footer card
and popup are hidden. Studio still shows them so they can be designed. Set the
token, restart locally or redeploy on Oxygen, and check the server log — the
browser only ever receives a generic message.

### `env pull` removed Weaverse or integration values

Shopify only knows Shopify-managed values. Restore `WEAVERSE_PROJECT_ID`, the
local `SESSION_SECRET`, and integration tokens from your password or secret
manager — never from Git history.

### Oxygen deploy succeeds but uses old configuration

Variable changes do not mutate existing deployments. Trigger a new deployment by
pushing a commit or running `npx shopify hydrogen deploy` after saving.
