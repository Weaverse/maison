import { CacheCustom, type Storefront } from "@shopify/hydrogen";
import type {
  CountryCode,
  CurrencyCode,
  LanguageCode,
} from "@shopify/hydrogen/storefront-api-types";
import type { I18nLocale, StoreLocalization } from "~/types/locale";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "~/utils/const";
import {
  getLocaleSegment,
  includeDefaultLocale,
  localeCode,
  localePathPrefix,
  selectSupportedLiveLocales,
} from "~/utils/locale";

type Language = {
  isoCode: LanguageCode;
  name: string;
  endonymName?: string | null;
};

type LocalizationQueryData = {
  localization: {
    country: {
      isoCode: CountryCode;
      name: string;
      currency: { isoCode: CurrencyCode };
    };
    language: Language;
    availableLanguages: Language[];
    availableCountries: Array<{
      isoCode: CountryCode;
      name: string;
      currency: { isoCode: CurrencyCode };
      availableLanguages: Language[];
    }>;
  };
};

/**
 * Resolve which locales this request may use.
 *
 * Shopify Markets is authoritative for what is live and for currency, while
 * `SUPPORTED_LOCALES` is authoritative for what the theme has a catalog for.
 * The selector shows the intersection, so enabling a market in the Shopify
 * admin is enough to publish a locale the theme already supports, and no
 * amount of admin configuration can surface one it does not.
 */
export async function loadStoreLocalization(
  storefront: Storefront,
  request: Request,
): Promise<StoreLocalization> {
  try {
    const { localization } = await storefront.query<LocalizationQueryData>(
      LOCALIZATION_QUERY,
      { cache: CacheCustom({ maxAge: 10, staleWhileRevalidate: 0 }) },
    );

    const liveLocales = localization.availableCountries.flatMap((country) => {
      // The active country reports its languages in two places; merge them so a
      // language published only at the top level is not lost.
      const countryLanguages =
        country.isoCode === localization.country.isoCode
          ? mergeLanguages(
              country.availableLanguages,
              localization.availableLanguages,
            )
          : country.availableLanguages;

      return countryLanguages.map<I18nLocale>((language) => ({
        label: `${country.name} · ${language.endonymName || language.name} · ${country.currency.isoCode}`,
        language: language.isoCode,
        country: country.isoCode,
        currency: country.currency.isoCode,
        pathPrefix: localePathPrefix({
          language: language.isoCode,
          country: country.isoCode,
        }),
        countryName: country.name,
        languageName: language.endonymName || language.name,
      }));
    });

    const supportedLiveLocales = selectSupportedLiveLocales(
      liveLocales,
      SUPPORTED_LOCALES,
    );
    const defaultLocale =
      supportedLiveLocales.find(
        (locale) => localeCode(locale) === localeCode(DEFAULT_LOCALE),
      ) ?? DEFAULT_LOCALE;
    const availableLocales = includeDefaultLocale(
      supportedLiveLocales,
      defaultLocale,
    );

    return {
      availableLocales,
      defaultLocale,
      selectedLocale: resolveSelected(request, availableLocales, defaultLocale),
    };
  } catch (error) {
    // Localization is not worth failing a page render over: fall back to the
    // default locale alone, which is always safe to serve.
    console.warn("Unable to load Shopify Markets localization", error);
    const availableLocales = [DEFAULT_LOCALE];
    return {
      availableLocales,
      defaultLocale: DEFAULT_LOCALE,
      selectedLocale: resolveSelected(
        request,
        availableLocales,
        DEFAULT_LOCALE,
      ),
    };
  }
}

function resolveSelected(
  request: Request,
  availableLocales: I18nLocale[],
  defaultLocale: I18nLocale,
) {
  const requestedCode = getLocaleSegment(new URL(request.url).pathname);
  return (
    availableLocales.find((locale) => localeCode(locale) === requestedCode) ??
    defaultLocale
  );
}

function mergeLanguages<T extends { isoCode: LanguageCode }>(
  ...languageGroups: T[][]
) {
  return Array.from(
    new Map(
      languageGroups.flat().map((language) => [language.isoCode, language]),
    ).values(),
  );
}

/**
 * The locale for a request, resolved from its URL alone.
 *
 * `createHydrogenContext` needs an i18n value before the Storefront client
 * exists, so this cannot wait on Shopify. It trusts `SUPPORTED_LOCALES`;
 * `loadStoreLocalization` then narrows that to what is actually live.
 */
export function getRequestI18n(request: Request): I18nLocale {
  const segment = getLocaleSegment(new URL(request.url).pathname);
  if (!segment) {
    return DEFAULT_LOCALE;
  }

  return (
    SUPPORTED_LOCALES.find((locale) => localeCode(locale) === segment) ??
    DEFAULT_LOCALE
  );
}

const LOCALIZATION_QUERY = `#graphql
  query storeLocalization {
    localization {
      country {
        isoCode
        name
        currency { isoCode }
      }
      language {
        isoCode
        name
        endonymName
      }
      availableLanguages {
        isoCode
        name
        endonymName
      }
      availableCountries {
        isoCode
        name
        currency { isoCode }
        availableLanguages {
          isoCode
          name
          endonymName
        }
      }
    }
  }
` as const;
