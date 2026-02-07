# @weaverse/maison

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
