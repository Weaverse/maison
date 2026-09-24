import { CaretDownIcon, CheckCircleIcon } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import { CartForm } from "@shopify/hydrogen";
import type { CartBuyerIdentityInput } from "@shopify/hydrogen/storefront-api-types";
import ReactCountryFlag from "react-country-flag";
import { useLocation, useSubmit } from "react-router";
import { useAvailableLocales, useSelectedLocale } from "~/hooks/use-locale";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { I18nLocale } from "~/types/locale";
import { cn } from "~/utils/cn";
import { localeCode, switchLocalePath } from "~/utils/locale";

export function CountrySelector({
  inputClassName,
  wrapperClassName,
  enableFlag = true,
  mode = "country",
}: {
  inputClassName?: string;
  wrapperClassName?: string;
  enableFlag?: boolean;
  mode?: "country" | "language";
}) {
  const submit = useSubmit();
  const selectedLocale = useSelectedLocale();
  const availableLocales = useAvailableLocales();
  const { pathname, search, hash } = useLocation();
  const cartAction = usePrefixPathWithLocale("/cart");

  // One dropdown per axis. Picking a country keeps the current language where
  // that pair exists, and picking a language keeps the current country, so
  // neither choice silently undoes the other.
  const localeOptions = uniqueBy(
    availableLocales,
    mode === "language" ? "language" : "country",
  ).flatMap((value) => {
    const keepsOtherAxis = availableLocales.find((candidate) =>
      mode === "language"
        ? candidate.language === value &&
          candidate.country === selectedLocale.country
        : candidate.country === value &&
          candidate.language === selectedLocale.language,
    );
    const anyMatch = availableLocales.find((candidate) =>
      mode === "language"
        ? candidate.language === value
        : candidate.country === value,
    );
    const match = keepsOtherAxis ?? anyMatch;
    return match ? [match] : [];
  });

  // Changing locale is a cart mutation as well as a navigation: the buyer's
  // country drives pricing, so it has to reach the cart before the redirect.
  function handleLocaleChange({
    redirectTo,
    buyerIdentity,
  }: {
    redirectTo: string;
    buyerIdentity: CartBuyerIdentityInput;
  }) {
    submit(
      {
        redirectTo,
        cartFormInput: JSON.stringify({
          action: CartForm.ACTIONS.BuyerIdentityUpdate,
          inputs: { buyerIdentity },
        }),
      },
      { method: "POST", action: cartAction },
    );
  }

  if (localeOptions.length < 2) {
    return null;
  }

  const selectedLabel =
    mode === "language"
      ? selectedLocale.languageName || selectedLocale.language
      : countryLabel(selectedLocale);

  return (
    <div className={cn("grid w-fit gap-4", wrapperClassName)}>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={mode === "language" ? "Language" : "Country"}
            className={cn(
              "flex h-[33px] cursor-pointer items-center gap-2 py-3 text-base leading-none tracking-[0.28px] outline-hidden",
              inputClassName,
            )}
          >
            <span className="whitespace-nowrap">{selectedLabel}</span>
            <CaretDownIcon className="h-4 w-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content>
            <div className="my-2 max-h-40 w-80 overflow-auto bg-neutral-800 py-2">
              {localeOptions.map((locale) => {
                const isSelected =
                  mode === "language"
                    ? locale.language === selectedLocale.language
                    : locale.country === selectedLocale.country;

                return (
                  <Popover.Close
                    key={localeCode(locale)}
                    type="button"
                    aria-label={locale.label}
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() =>
                      handleLocaleChange({
                        redirectTo: switchLocalePath({
                          pathname,
                          search,
                          hash,
                          locale,
                        }),
                        buyerIdentity: { countryCode: locale.country },
                      })
                    }
                    className="flex w-full cursor-pointer items-center gap-2 bg-neutral-800 p-2 px-4 py-2 text-left text-sm text-white transition hover:bg-neutral-600"
                  >
                    {enableFlag && mode === "country" ? (
                      <ReactCountryFlag
                        svg
                        countryCode={locale.country}
                        style={{ width: "24px", height: "14px" }}
                      />
                    ) : null}
                    <span>
                      {mode === "language"
                        ? locale.languageName || locale.language
                        : countryLabel(locale)}
                    </span>
                    {isSelected ? (
                      <span className="ml-auto">
                        <CheckCircleIcon className="h-5 w-5" />
                      </span>
                    ) : null}
                  </Popover.Close>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function uniqueBy(locales: I18nLocale[], key: "language" | "country") {
  return Array.from(new Set(locales.map((locale) => locale[key])));
}

function countryLabel(locale: I18nLocale) {
  return `${locale.countryName || locale.country} · ${locale.currency}`;
}
