# @weaverse/maison

## 2026.11.10

First release since `v2026.6.12`. Everything merged to `main` between 2026-08-20 and 2026-11-09.

### Storefront design

- Refreshed the visual system, the home page sections and the page layout, including a reworked footer, announcement bar and product gallery, and new Highlights, Instagram, Image with product and Rich text sections.
- Rebuilt testimonials as a carousel and gave featured collections an editorial layout with grid and carousel displays.

### Shopping experience

- Reworked the collection, product, cart and search surfaces to the approved designs: cart order summary and pre-discount subtotal, variant table layouts for tablet and desktop, collection card product counts, sort dropdown, related products header and the mobile search bar.

### B2B

- Pricing, checkout and settlement for the B2B cart now run through B2Bridge, with buyer- and market-scoped price caching and draft orders that are never raised twice for the same cart.

### Carts and accounts

- Fixed the case where signing in as a second account on the same browser exposed the previous shopper's cart, checkout attributes and company-location pricing.
- Removing several cart lines in quick succession no longer brings a deleted line back on screen.

### Content and setup

- Every section preset and default now ships placeholder content only, so a new project starts from clean presets instead of demo data.
- Localised the storefront: locale-prefixed cart and quick-shop requests, translated newsletter and shipping copy, editable footer and quick-shop labels from theme settings, and corrected sitemap URLs.
- Judge.me and Klaviyo surfaces are integration-ready: tokens stay server-side and the surfaces stay hidden until a token is present.
- Added the setup, section and third-party integration guides.

### Maintenance

- Pinned `@shopify/hydrogen` to the 2026.4 line and held `motion-dom` below the release that dropped `activeAnimations`.
- Automated the `worker-deploy` branch sync.

## 1.0.0

### Initial Independent Release

Maison is now an independent Hydrogen theme, moving away from its original fork ancestry. This release marks a significant milestone with a completely modernized tech stack and refactored architecture.

### Key Features

- **Visual Building with Weaverse**: Full integration with the Weaverse visual page builder for Hydrogen.
- **Modern Tech Stack**:
  - **React Router 7**: Leveraging the latest features for routing and data loading.
  - **Tailwind CSS v4**: Utilizing the newest utility-first CSS framework.
  - **TypeScript**: Strict type safety throughout the project.
  - **Biome**: Fast and efficient linting and formatting.
- **Component Architecture**:
  - **Ref-as-props Pattern**: Simplified component communication and improved API consistency.
  - **Radix UI**: Accessible UI primitives for complex components.
  - **Zustand**: Efficient state management for global UI state.
- **Shopify Features**:
  - **Customer Account API**: Support for the new OAuth-based customer accounts.
  - **Storefront API**: Optimized queries and fragments for high-performance storefronts.
  - **Combined Listings**: Intelligent product grouping and filtering logic.
- **Performance**:
  - **Parallel Data Loading**: Efficient server-side fetching in route loaders.
  - **View Transitions**: Smooth animations using native browser APIs.
- **Testing**: Comprehensive E2E coverage with Playwright.

### Refactoring & Improvements

- Migrated all components from `forwardRef` to standard functional components with `ref` props.
- Enhanced search experience with faceted filtering and sorting.
- Replaced third-party carousel libraries with native CSS scroll where appropriate for better performance.
- Streamlined project structure and documentation.
