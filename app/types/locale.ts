import type { I18nBase } from "@shopify/hydrogen";
import type { CurrencyCode } from "@shopify/hydrogen/storefront-api-types";

export type Localizations = Record<string, I18nLocale>;

export type I18nLocale = I18nBase & {
  currency: CurrencyCode;
  label: string;
  pathPrefix: string;
  countryName?: string;
  languageName?: string;
};

export type StoreLocalization = {
  /** Locales the theme supports that Shopify also has live, default first. */
  availableLocales: I18nLocale[];
  /** The locale served from the unprefixed root. */
  defaultLocale: I18nLocale;
  /** The locale this request resolved to. */
  selectedLocale: I18nLocale;
};
