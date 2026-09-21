import type { I18nLocale, StoreLocalization } from "~/types/locale";
import { DEFAULT_LOCALE } from "~/utils/const";

const LOCALE_SEGMENT = /^[a-z]{2}-[a-z]{2}$/i;
const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i;

/** Paths that never carry a locale prefix and must not be redirected. */
const STATIC_PATHS = [
  "/__manifest",
  "/assets",
  "/favicon.ico",
  "/robots.txt",
  "/.well-known",
  "/cdn-cgi",
];

export function localeCode(locale: Pick<I18nLocale, "language" | "country">) {
  return `${locale.language}-${locale.country}`.toLowerCase();
}

/** The default locale is served from the root, every other one from `/xx-yy`. */
export function localePathPrefix(
  locale: Pick<I18nLocale, "language" | "country">,
) {
  const code = localeCode(locale);
  return code === localeCode(DEFAULT_LOCALE) ? "" : `/${code}`;
}

/**
 * Keep the configured locale order while discarding Shopify language-country
 * combinations the theme has no catalog for. Live Shopify metadata, currency
 * included, stays authoritative.
 */
export function selectSupportedLiveLocales(
  liveLocales: readonly I18nLocale[],
  supportedLocales: readonly I18nLocale[],
) {
  return supportedLocales.flatMap((supportedLocale) => {
    const liveLocale = liveLocales.find(
      (candidate) => localeCode(candidate) === localeCode(supportedLocale),
    );

    return liveLocale
      ? [{ ...liveLocale, pathPrefix: supportedLocale.pathPrefix }]
      : [];
  });
}

/**
 * The root locale has to stay selectable even when Shopify omits the active
 * country from `localization.availableCountries`.
 */
export function includeDefaultLocale(
  locales: readonly I18nLocale[],
  defaultLocale: I18nLocale,
) {
  const defaultCode = localeCode(defaultLocale);
  const liveDefault = locales.find(
    (locale) => localeCode(locale) === defaultCode,
  );

  return [
    liveDefault ?? defaultLocale,
    ...locales.filter((locale) => localeCode(locale) !== defaultCode),
  ];
}

export function getLocaleSegment(pathname: string) {
  const segment = (pathname.split("/").filter(Boolean)[0] ?? "").replace(
    /\.data$/i,
    "",
  );
  return LOCALE_SEGMENT.test(segment) ? segment.toLowerCase() : null;
}

export function stripLocalePrefix(pathname: string) {
  const segment = getLocaleSegment(pathname);
  if (!segment) {
    return pathname || "/";
  }

  const rawSegment = pathname.split("/").filter(Boolean)[0] ?? segment;
  const withoutLocale = pathname.slice(rawSegment.length + 1);
  return withoutLocale || "/";
}

/** Same page, different locale — query string and hash are carried over. */
export function switchLocalePath({
  pathname,
  search = "",
  hash = "",
  locale,
}: {
  pathname: string;
  search?: string;
  hash?: string;
  locale: Pick<I18nLocale, "language" | "country">;
}) {
  const path = stripLocalePrefix(pathname);
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const localizedPath = `${localePathPrefix(locale)}${suffix}` || "/";
  return `${localizedPath}${search}${hash}`;
}

export function prefixPathWithLocale(
  to: string,
  locale: Pick<I18nLocale, "language" | "country">,
) {
  if (
    !to ||
    to.startsWith("#") ||
    to.startsWith("?") ||
    to.startsWith("//") ||
    ABSOLUTE_URL.test(to)
  ) {
    return to;
  }

  const [pathAndSearch, hash = ""] = to.split("#", 2);
  const [pathname, search = ""] = pathAndSearch.split("?", 2);

  if (getLocaleSegment(pathname)) {
    return to;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const prefix = localePathPrefix(locale);
  const localizedPath =
    `${prefix}${normalizedPath === "/" && prefix ? "" : normalizedPath}` || "/";

  return `${localizedPath}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

/** BCP 47 tag for the `Intl` formatters. */
export function intlLocale(locale: Pick<I18nLocale, "language" | "country">) {
  return `${locale.language.toLowerCase()}-${locale.country.toUpperCase()}`;
}

export function formatDate(
  value: Date | string | number,
  locale: Pick<I18nLocale, "language" | "country">,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
) {
  const date = value instanceof Date ? value : new Date(value);
  // `Intl.format` throws on an invalid date, which would take down the whole
  // page. Show the raw value instead: wrong-looking text beats a 500.
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(intlLocale(locale), options).format(date);
}

/**
 * Review timestamps: the date and the time. `Intl` joins the two the way each
 * locale expects, so there is no connector word to translate.
 */
export function formatDateTime(
  value: Date | string | number,
  locale: Pick<I18nLocale, "language" | "country">,
) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return formatDate(date, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatNumber(
  value: number,
  locale: Pick<I18nLocale, "language" | "country">,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

export function formatCurrency(
  value: number,
  locale: Pick<I18nLocale, "language" | "country" | "currency">,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">,
) {
  return formatNumber(value, locale, {
    ...options,
    style: "currency",
    currency: locale.currency,
  });
}

/**
 * The default locale has two URLs — `/` and its own prefix. Redirect the
 * prefixed one to the root so pages have a single canonical address.
 */
export function getCanonicalLocaleRedirect(
  request: Request,
  localization: StoreLocalization,
) {
  if (!(request.method === "GET" || request.method === "HEAD")) {
    return null;
  }

  const url = new URL(request.url);
  if (
    url.pathname.endsWith(".data") ||
    STATIC_PATHS.some(
      (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
    )
  ) {
    return null;
  }

  const requestedLocale = getLocaleSegment(url.pathname);
  if (
    requestedLocale !== localeCode(localization.defaultLocale) ||
    localization.defaultLocale.pathPrefix
  ) {
    return null;
  }

  // `//evil.com` is a protocol-relative URL, not a path: resolving it against
  // our own origin hands back someone else's, which would turn this redirect
  // into an open one. Only hand back a destination that stayed here.
  const destination = new URL(
    `${stripLocalePrefix(url.pathname)}${url.search}`,
    url.origin,
  );
  if (destination.origin !== url.origin) {
    return null;
  }

  return `${destination.pathname}${destination.search}`;
}
