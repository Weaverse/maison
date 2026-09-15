import { type RouteConfig, route } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";
import { hydrogenRoutes } from "@shopify/hydrogen";

// Manual route definitions can be added to this array, in addition to or instead of using the `flatRoutes` file-based routing convention.
// See https://remix.run/docs/en/main/guides/routing for more details
export default hydrogenRoutes([
  // APIs. Keep reviews on its own path rather than folding it into the product
  // route as an optional `/reviews?` segment: a dynamic segment never matches
  // across a slash, so as two distinct paths neither can swallow the other's
  // URL, whatever order they appear in.
  route(
    "/:locale?/api/product/:productHandle/reviews",
    "routes/api/reviews.ts",
  ),
  route(
    "/:locale?/api/product/:productHandle",
    "routes/api/product.$productHandle.ts",
  ),
  // Flat routes for all other files in the routes directory
  ...(await flatRoutes()),
]) satisfies RouteConfig;
