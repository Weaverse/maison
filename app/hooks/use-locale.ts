import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";
import type { I18nLocale } from "~/types/locale";
import { DEFAULT_LOCALE } from "~/utils/const";

/** The locale this page is being served in. */
export function useSelectedLocale(): I18nLocale {
  const rootData = useRouteLoaderData<RootLoader>("root");
  return rootData?.selectedLocale ?? DEFAULT_LOCALE;
}

/** Every locale the selector may offer, default first. */
export function useAvailableLocales(): I18nLocale[] {
  const rootData = useRouteLoaderData<RootLoader>("root");
  return rootData?.availableLocales ?? [DEFAULT_LOCALE];
}
