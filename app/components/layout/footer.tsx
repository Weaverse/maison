import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";

import * as Accordion from "@radix-ui/react-accordion";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { useFetcher } from "react-router";
import { CompanyLocationButton } from "~/components/b2b/company-location-button";
import { RevealUnderline } from "~/components/reveal-underline";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";
import {
  AmexIcon,
  DinersClubIcon,
  MastercardIcon,
  PaypalIcon,
  VisaIcon,
} from "../icons";
import Link from "../link";
import { CountrySelector } from "./country-selector";

const variants = cva("", {
  variants: {
    width: {
      full: "",
      stretch: "",
      fixed: "mx-auto max-w-(--page-width)",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "mx-auto px-5 md:px-6 lg:px-6",
    },
  },
});

// Traced from the Figma newsletter assets. Like the divider star these are
// stroked paths (stroke-width 2 on an 18px viewBox), so Phosphor's filled
// outlines are not a match.
function MailIcon() {
  return (
    <svg
      aria-hidden
      fill="none"
      height="18"
      viewBox="0 0 18 18"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.5006 5.25038L9.75681 9.5452C9.52796 9.67809 9.26802 9.74809 9.00338 9.74809C8.73873 9.74809 8.47879 9.67809 8.24994 9.5452L1.4994 5.25038M2.99952 3.0006H15.0005C15.829 3.0006 16.5006 3.67211 16.5006 4.50045V13.4996C16.5006 14.3279 15.829 14.9994 15.0005 14.9994H2.99952C2.17103 14.9994 1.4994 14.3279 1.4994 13.4996V4.50045C1.4994 3.67211 2.17103 3.0006 2.99952 3.0006Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden
      fill="none"
      height="18"
      viewBox="0 0 18 18"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.7494 9H14.2506M9 14.2506L14.2506 9L9 3.7494"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

// Traced from the Figma divider asset. Not a Phosphor glyph: it is a stroked
// path (stroke-width 2 on a 20px viewBox), while Phosphor draws filled outlines.
function StarDividerIcon() {
  return (
    <svg
      aria-hidden
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.76788 1.73243C9.69793 1.77586 9.64152 1.83796 9.605 1.91174L7.68083 5.81091C7.55392 6.0678 7.36648 6.29001 7.13465 6.4584C6.90282 6.62679 6.63355 6.73633 6.35 6.77758L2.04583 7.40675C1.96392 7.41833 1.88691 7.45268 1.82356 7.5059C1.76022 7.55911 1.7131 7.62905 1.68757 7.70774C1.66203 7.78643 1.65911 7.87071 1.67914 7.95097C1.69916 8.03124 1.74133 8.10427 1.80083 8.16175L4.91417 11.1926C5.11967 11.3927 5.27341 11.6398 5.36211 11.9126C5.45082 12.1854 5.47183 12.4757 5.42333 12.7584L4.68917 17.0409C4.67488 17.1223 4.68373 17.2061 4.71471 17.2828C4.74569 17.3594 4.79756 17.4258 4.86441 17.4744C4.93126 17.523 5.01042 17.5519 5.09288 17.5578C5.17533 17.5637 5.25778 17.5463 5.33083 17.5076L9.17833 15.4842C9.4319 15.3511 9.71402 15.2815 10.0004 15.2815C10.2868 15.2815 10.5689 15.3511 10.8225 15.4842L14.6708 17.5076C14.7439 17.5465 14.8265 17.5641 14.9091 17.5583C14.9916 17.5526 15.071 17.5237 15.138 17.4751C15.2049 17.4264 15.2569 17.3599 15.2879 17.2831C15.3189 17.2064 15.3277 17.1224 15.3133 17.0409L14.5783 12.7576C14.5301 12.475 14.5512 12.1849 14.6399 11.9123C14.7286 11.6396 14.8822 11.3927 15.0875 11.1926L18.2008 8.16091C18.2598 8.10337 18.3016 8.03047 18.3213 7.95044C18.3411 7.87042 18.338 7.78647 18.3125 7.70808C18.287 7.6297 18.2401 7.56002 18.1771 7.50691C18.114 7.45381 18.0374 7.4194 17.9558 7.40758L13.6508 6.77758C13.3676 6.73601 13.0987 6.62633 12.8672 6.45796C12.6357 6.28959 12.4485 6.06755 12.3217 5.81091L10.3967 1.91174C10.3601 1.83796 10.3037 1.77586 10.2338 1.73243C10.1638 1.68901 10.0832 1.666 10.0008 1.666C9.91851 1.666 9.83782 1.68901 9.76788 1.73243Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function Footer() {
  const { shopName } = useShopMenu();
  const {
    footerWidth,
    socialFacebook,
    socialInstagram,
    socialLinkedIn,
    socialX,
    bio,
    copyright,
    showNewsletterSignup,
    footerBrandTitle,
    showFooterWordmark,
    footerWordmark,
    footerWordmarkScale,
    newsletterTitle,
    newsletterDescription,
    newsletterPlaceholder,
    newsletterButtonText,
    showVisaIcon,
    showMastercardIcon,
    showAmexIcon,
    showPaypalIcon,
    showDinersClubIcon,
  } = useThemeSettings();
  const fetcher = useFetcher<{ ok: boolean; error: string }>();

  // Compute message and error from fetcher data
  const message = fetcher.data?.ok ? "Thank you for signing up! 🎉" : "";
  const error =
    fetcher.data && !fetcher.data.ok
      ? fetcher.data.error || "An error occurred while signing up."
      : "";

  // Payment icons map
  const PAYMENT_ICON_MAP: Record<string, React.ComponentType> = {
    VISA: VisaIcon,
    MASTERCARD: MastercardIcon,
    AMERICAN_EXPRESS: AmexIcon,
    AMEX: AmexIcon, // Alias
    PAYPAL: PaypalIcon,
    DINERS_CLUB: DinersClubIcon,
  };

  // Get payment icons based on user selection
  const getPaymentIcons = () => {
    const icons: string[] = [];
    if (showVisaIcon) {
      icons.push("VISA");
    }
    if (showMastercardIcon) {
      icons.push("MASTERCARD");
    }
    if (showAmexIcon) {
      icons.push("AMEX");
    }
    if (showPaypalIcon) {
      icons.push("PAYPAL");
    }
    if (showDinersClubIcon) {
      icons.push("DINERS_CLUB");
    }
    return icons;
  };

  const paymentIconKeys = getPaymentIcons();
  const wordmarkText = footerWordmark || shopName || "";
  const wordmarkScale = (footerWordmarkScale ?? 100) / 100;

  const SOCIAL_ACCOUNTS = [
    {
      name: "Facebook",
      to: socialFacebook,
      Icon: FacebookLogoIcon,
    },
    {
      name: "X",
      to: socialX,
      Icon: XLogoIcon,
    },
    {
      name: "Instagram",
      to: socialInstagram,
      Icon: InstagramLogoIcon,
    },
    {
      name: "LinkedIn",
      to: socialLinkedIn,
      Icon: LinkedinLogoIcon,
    },
  ].filter((acc) => acc.to && acc.to.trim() !== "");

  return (
    <footer
      className={cn(
        "w-full bg-(--color-footer-bg) pt-9 text-(--color-footer-text) lg:pt-16",
        variants({ padding: footerWidth }),
      )}
    >
      <div className={cn("h-full w-full", variants({ width: footerWidth }))}>
        <div className="pb-10">
          <div className="flex w-full flex-col gap-16 md:flex-row md:gap-6 lg:gap-16">
            {/* Brand */}
            <div className="flex flex-1 flex-col items-start gap-4">
              <p className="whitespace-nowrap font-serif text-[18px] text-[#F1F1E6]">
                {footerBrandTitle}
              </p>
              {bio ? (
                <div
                  className="w-full text-[#DBD7D1] text-[16px] leading-[1.6]"
                  dangerouslySetInnerHTML={{ __html: bio }}
                />
              ) : null}

              {/* brand-meta: stacked below lg, inline from lg */}
              <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
                {/* Location carries a label above it, so the pair is bottom
                    aligned rather than centred. */}
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                  <CompanyLocationButton className="text-[#FEF6EB]" showLabel />
                  <div className="w-full sm:w-[240px]">
                    <CountrySelector />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {SOCIAL_ACCOUNTS.filter(({ to }) => Boolean(to)).map(
                    ({ to, name, Icon }) => (
                      <Link
                        key={name}
                        to={to}
                        target="_blank"
                        aria-label={name}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#A79D95] transition-opacity hover:opacity-70"
                      >
                        <Icon className="size-[18px]" />
                      </Link>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Newsletter Card (Conditional) */}
            {showNewsletterSignup && (
              <div className="flex w-full flex-1 flex-col gap-3 rounded-[16px] bg-[#585247] p-6">
                <p className="whitespace-nowrap font-serif text-[22px] text-[#F1F1E6]">
                  {newsletterTitle}
                </p>
                <p className="text-[13px] text-[#DBD7D1] leading-[1.6]">
                  {newsletterDescription}
                </p>
                <fetcher.Form
                  action="/api/klaviyo"
                  method="POST"
                  encType="multipart/form-data"
                >
                  <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-full items-center gap-2.5 rounded-[12px] border border-[#A79D95] bg-[#2B2620] px-3.5 sm:flex-1">
                      <span className="shrink-0 text-[#A79D95]">
                        <MailIcon />
                      </span>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder={newsletterPlaceholder}
                        className="min-w-0 grow bg-transparent text-[#F1F1E6] text-base placeholder:text-[#A79D95] focus-visible:outline-hidden"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={fetcher.state === "submitting"}
                      className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#F1F1E6] px-4 font-bold text-[#2B2620] text-base transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
                    >
                      {newsletterButtonText}
                      <ArrowRightIcon />
                    </button>
                  </div>
                </fetcher.Form>
                <div className="min-h-8">
                  {error && (
                    <div className="flex w-fit gap-1 bg-red-100 px-2 py-1 text-red-700">
                      <p className="font-semibold">ERROR:</p>
                      <p>{error}</p>
                    </div>
                  )}
                  {message && (
                    <div className="w-fit py-1 text-green-500">{message}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <FooterMenu />
        {/* Same treatment as the star divider below */}
        <div className="h-px w-full bg-[#A79D95] opacity-35" />
        <div className="flex flex-col gap-6 py-6 md:flex-row md:flex-wrap md:justify-between lg:flex-nowrap lg:items-center">
          {/* Payment Icons - Order 2 on mobile/tablet, Order 3 on desktop */}
          {paymentIconKeys.length > 0 && (
            <div className="order-2 flex items-center gap-3 lg:order-3">
              {paymentIconKeys.map((key) => {
                const Icon = PAYMENT_ICON_MAP[key];
                return Icon ? <Icon key={key} /> : null;
              })}
            </div>
          )}

          {/* Copyright - Order 3 on mobile/tablet (full width on tablet), Order 1 on desktop */}
          <div
            className="order-3 text-sm md:w-full lg:order-1 lg:w-auto"
            dangerouslySetInnerHTML={{ __html: copyright }}
          />
        </div>

        {/* Divider with star */}
        <div className="flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-[#A79D95] opacity-35" />
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#686766]">
            <StarDividerIcon />
          </div>
          <div className="h-px flex-1 bg-[#A79D95] opacity-35" />
        </div>

        {/* Oversized wordmark */}
        {showFooterWordmark ? (
          <div className="@container w-full overflow-hidden">
            {/* Sized from the container rather than fixed breakpoints, so the
                wordmark always spans the same width as the divider above it.
                With `tracking` at 1.28em and the trailing letter-space cancelled,
                the rendered width is about `fontSize * (1.86n - 1.28)` for n
                characters — 1.86 folds in Belleza's average glyph advance — so
                dividing the container width by that factor makes it fill. */}
            <p
              className="w-full whitespace-nowrap pt-5 pb-10 text-center font-serif text-[rgb(241_241_230_/_20%)] leading-[0.9] tracking-[1.28em] [font-size:calc(100cqw*var(--wordmark-scale)/(1.86*var(--wordmark-chars)-1.28))] lg:pt-8 lg:pb-14"
              style={
                {
                  "--wordmark-chars": wordmarkText.length || 1,
                  "--wordmark-scale": wordmarkScale,
                } as React.CSSProperties
              }
            >
              <span className="-mr-[1.28em] inline-block">{wordmarkText}</span>
            </p>
          </div>
        ) : null}
      </div>
    </footer>
  );
}

function FooterMenu() {
  const { footerMenu } = useShopMenu();
  const items = footerMenu.items as unknown as SingleMenuItem[];
  return (
    <Accordion.Root
      type="multiple"
      defaultValue={items.map(({ id }) => id)}
      className="grid w-full grid-cols-2 md:grid-cols-4 lg:gap-8 py-10"
    >
      {items.map(({ id, to, title, items: childItems }) => (
        <Accordion.Item key={id} value={id} className="flex flex-col">
          <Accordion.Trigger className="flex items-center justify-between py-4 text-left font-medium lg:hidden data-[state=open]:[&>svg]:rotate-90">
            {["#", "/"].includes(to) ? (
              <span>{title}</span>
            ) : (
              <Link to={to}>{title}</Link>
            )}
            {/* <CaretRightIcon className="h-4 w-4 rotate-0 transition-transform" /> */}
          </Accordion.Trigger>
          <div className="hidden text-sm font-medium lg:block">
            {["#", "/"].includes(to) ? title : <Link to={to}>{title}</Link>}
          </div>
          <Accordion.Content
            style={
              {
                "--expand-duration": "0.15s",
                "--expand-to": "var(--radix-accordion-content-height)",
                "--collapse-duration": "0.15s",
                "--collapse-from": "var(--radix-accordion-content-height)",
              } as React.CSSProperties
            }
            className={clsx([
              "overflow-hidden",
              "data-[state=closed]:animate-collapse",
              "data-[state=open]:animate-expand",
            ])}
          >
            <div className="flex flex-col gap-2 pb-4 lg:pt-6">
              {childItems.map((child) => (
                <Link
                  to={child.to}
                  key={child.id}
                  // `Link`'s base style is `inline-flex justify-center`; in this
                  // stretched flex column that would centre each label.
                  className="group relative w-fit justify-start gap-2 text-sm"
                >
                  <RevealUnderline className="[--underline-color:var(--color-footer-text)]">
                    {child.title}
                  </RevealUnderline>
                  {child.isExternal && (
                    <span className="invisible group-hover:visible text-sm">
                      ↗
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
