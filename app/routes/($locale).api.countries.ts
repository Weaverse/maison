import { CacheLong, generateCacheControlHeader } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";

/**
 * The locales this storefront can serve — the theme's supported list narrowed
 * to what Shopify Markets has live, resolved once per request in the context.
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const { availableLocales, defaultLocale, selectedLocale } =
    context.localization;

  return data(
    { availableLocales, defaultLocale, selectedLocale },
    { headers: { "cache-control": generateCacheControlHeader(CacheLong()) } },
  );
}
