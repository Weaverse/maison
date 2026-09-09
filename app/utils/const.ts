import type { I18nLocale, Localizations } from "~/types/locale";

export const COUNTRIES: Localizations = {
  default: {
    label: "United States (USD $)",
    language: "EN",
    country: "US",
    currency: "USD",
  },
  "/en-au": {
    label: "Australia (AUD $)",
    language: "EN",
    country: "AU",
    currency: "AUD",
  },
  "/en-ca": {
    label: "Canada (CAD $)",
    language: "EN",
    country: "CA",
    currency: "CAD",
  },
  "/en-cn": {
    label: "China (CNY ¥)",
    language: "EN",
    country: "CN",
    currency: "CNY",
  },
  "/en-de": {
    label: "Germany (EUR €)",
    language: "EN",
    country: "DE",
    currency: "EUR",
  },
  "/en-es": {
    label: "Spain (EUR €)",
    language: "EN",
    country: "ES",
    currency: "EUR",
  },
  "/en-fr": {
    label: "France (EUR €)",
    language: "EN",
    country: "FR",
    currency: "EUR",
  },
  "/en-gb": {
    label: "United Kingdom (GBP £)",
    language: "EN",
    country: "GB",
    currency: "GBP",
  },
  "/en-it": {
    label: "Italy (EUR €)",
    language: "EN",
    country: "IT",
    currency: "EUR",
  },
  "/en-jp": {
    label: "Japan (JPY ¥)",
    language: "EN",
    country: "JP",
    currency: "JPY",
  },

  "/en-nl": {
    label: "Netherlands (EUR €)",
    language: "EN",
    country: "NL",
    currency: "EUR",
  },
  "/en-vn": {
    label: "Vietnam (VND ₫)",
    language: "EN",
    country: "VN",
    currency: "VND",
  },
};

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

export const DEFAULT_LOCALE: I18nLocale = Object.freeze({
  ...COUNTRIES.default,
  pathPrefix: "",
});
