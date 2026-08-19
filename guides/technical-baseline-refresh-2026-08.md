# Technical baseline refresh — August 2026

Maison now follows the August 2026 Pilot dependency and runtime baseline while
retaining its theme-specific integrations and flat-route layout.

## Baseline

- Node.js `>=22.12.0`
- Hydrogen `2026.4.5`
- React Router `7.16.0`
- React and React DOM `19.2.8`
- TypeScript `6.0.3`
- Tailwind CSS `4.3.3`
- Weaverse Hydrogen SDK `5.20.2`
- Vite `8.2.1`

The remaining shared direct dependencies and their resolved versions match the
Pilot lockfile.

## Compatibility changes

- Hydrogen now uses `hydrogenPreset()` and the React Router v8 future flags.
- Request context creation moved from `server.ts` to
  `app/.server/context.ts` and preserves the `RouterContextProvider` instance.
- Route and session APIs now come directly from `react-router`; direct
  dependencies on `@shopify/remix-oxygen` and `@shopify/hydrogen-react` were
  removed.
- Weaverse is attached to the Hydrogen router context without spreading the
  context instance.
- Cart context now provides distinct query and mutation fragments.
- `react-player` is replaced with a no-op module in SSR builds so its
  browser-only media stack is not included in the Oxygen worker.
- `dev` generates React Router types first, and the stable Customer Account
  push flag replaces the previous unstable flag.

Maison continues to use `@react-router/fs-routes`; converting the existing flat
route filenames to Pilot's directory-based route layout is intentionally out of
scope for this compatibility refresh.

## Verification

- `npm install`: passed; 887 packages audited.
- `npm run codegen`: passed.
- `npm run routes-check`: passed; all standard Shopify routes are present.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 17 non-blocking warnings.
- `npm run build`: passed; client and Oxygen SSR bundles generated.
- `npm run dev`: reached the ready state at `http://localhost:3456/`, then was
  stopped intentionally after the smoke test.

## Follow-up work

- `npm install` reports 18 transitive dependency advisories: 3 low, 6 moderate,
  8 high, and 1 critical. Review them separately; do not apply
  `npm audit fix --force` without compatibility testing.
- Shopify tooling reports that its `envFile` option is deprecated in favor of
  `envDir: false`; this warning originates in the current toolchain rather than
  Maison's configuration.
- The client build still reports large lazy media chunks and a `dashjs`
  CommonJS-in-ESM warning. These do not block the build but are candidates for a
  separate bundle-optimization task.
- Existing lint warnings include two React 19 `forwardRef` migrations and other
  pre-existing cleanup opportunities. They are intentionally not changed here
  to keep behavior changes minimal.

`.env.example` did not require changes, and no secret values were added.
