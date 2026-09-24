import type { I18nLocale } from "~/types/locale";

/**
 * Canada is the store's default market and is served from the unprefixed root.
 */
export const DEFAULT_LOCALE: I18nLocale = Object.freeze({
  label: "Canada · English · USD",
  language: "EN",
  country: "CA",
  currency: "USD",
  pathPrefix: "",
  countryName: "Canada",
  languageName: "English",
});

export const VIETNAM_LOCALE: I18nLocale = Object.freeze({
  label: "Việt Nam · Tiếng Việt · VND",
  language: "VI",
  country: "VN",
  currency: "VND",
  pathPrefix: "/vi-vn",
  countryName: "Việt Nam",
  languageName: "Tiếng Việt",
});

/**
 * Only publish locales whose storefront translation catalog is complete.
 * Shopify Markets must also have the locale live before it reaches the
 * production selector — `loadStoreLocalization` intersects this list with what
 * Shopify actually serves. Add a locale here only once its UI catalog and
 * locale navigation have been checked.
 */
export const SUPPORTED_LOCALES: readonly I18nLocale[] = Object.freeze([
  DEFAULT_LOCALE,
  VIETNAM_LOCALE,
]);

export const PAGINATION_SIZE = 16;

/**
 * How many product ids a collection card fetches to report its product count.
 *
 * `Collection` has no count field in the Storefront API, so the only way to
 * report one is to fetch ids and read `pageInfo.hasNextPage`; past this many the
 * label falls back to "N+". Both the collections page and the featured
 * collections section read it from here so the same collection cannot report
 * two different numbers.
 */
export const COLLECTION_PRODUCT_COUNT_LIMIT = 250;
