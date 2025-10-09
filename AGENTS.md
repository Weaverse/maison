# AGENTS.md - Quick Reference for AI Coding Agents

## Commands
- **Dev**: `npm run dev` (port 3456) | **Build**: `npm run build` | **Preview**: `npm run preview`
- **Before commit**: `npm run biome:fix && npm run typecheck`
- **Test single**: `npx playwright test tests/cart.test.ts` | **Test all**: `npm run e2e`
- **GraphQL**: `npm run codegen` (run after modifying queries/fragments)

## Code Style
- **Imports**: Use `~/` alias for `/app/*` imports (e.g., `import { cn } from "~/utils/cn"`)
- **Format**: Double quotes, semicolons, trailing commas, 2 spaces indentation
- **Naming**: camelCase (vars/funcs), PascalCase (components), kebab-case (files), ALL_CAPS (constants)
- **Types**: Always type params/returns, avoid `any`, use interfaces for data structures
- **React**: Functional components only, forwardRef for Weaverse sections
- **Async**: Use async/await with try/catch error handling
- **Classes**: Use `cn()` from `~/utils/cn.ts` for merging Tailwind classes

## Critical Patterns
- **Parallel loading**: Always use `Promise.all([storefront.query(), weaverse.loadPage(), ...])` in route loaders
- **New sections**: Export default component + schema + optional loader, register in `/app/weaverse/components.ts`
- **GraphQL**: Fragments in `/app/graphql/fragments.ts`, queries in `/app/graphql/queries.ts`
- **Combined Listings**: Use utils from `~/utils/combined-listings.ts` for product filtering
- **Customer Account**: Only use in `*.account*.{ts,tsx}` files

## Package Manager
- Use `npm` only (not pnpm or yarn)
