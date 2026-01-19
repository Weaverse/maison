import {
  CaretRightIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  MapPinIcon,
  XLogoIcon,
} from "@phosphor-icons/react";

import * as Accordion from "@radix-ui/react-accordion";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import { RevealUnderline } from "~/components/reveal-underline";
import type { CustomerCompanyLocationConnection } from "~/graphql/customer-locations-query.account";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";
import { useB2BLocation } from "../b2b/b2b-location-provider";
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

export function Footer() {
  const { shopName } = useShopMenu();
  const {
    footerWidth,
    socialFacebook,
    socialInstagram,
    socialLinkedIn,
    socialX,
    footerLogoData,
    footerLogoWidth,
    bio,
    copyright,
    addressTitle,
    storeAddress,
    storeEmail,
    showNewsletterSignup,
    newsletterTitle,
    newsletterDescription,
    newsletterPlaceholder,
    newsletterButtonText,
    paymentIconsMode,
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

  // Get payment icons based on mode
  const getPaymentIcons = () => {
    if (paymentIconsMode === "none") {
      return [];
    }

    // Manual mode
    const manualIcons: string[] = [];
    if (showVisaIcon) {
      manualIcons.push("VISA");
    }
    if (showMastercardIcon) {
      manualIcons.push("MASTERCARD");
    }
    if (showAmexIcon) {
      manualIcons.push("AMEX");
    }
    if (showPaypalIcon) {
      manualIcons.push("PAYPAL");
    }
    if (showDinersClubIcon) {
      manualIcons.push("DINERS_CLUB");
    }
    return manualIcons;
  };

  const paymentIconKeys = getPaymentIcons();

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
          <div
            className={cn(
              "grid w-full gap-6 md:grid-cols-2",
              showNewsletterSignup ? "lg:grid-cols-4" : "lg:grid-cols-3",
            )}
          >
            {/* Logo Column */}
            <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-1">
              {footerLogoData ? (
                <div className="relative" style={{ width: footerLogoWidth }}>
                  <Image
                    data={footerLogoData}
                    sizes="auto"
                    width={500}
                    className="h-full w-full object-contain object-left"
                  />
                </div>
              ) : (
                <div className="font-medium text-base uppercase">
                  {shopName}
                </div>
              )}
            </div>

            {/* Ware/Bio Column */}
            <div className="flex flex-col gap-6">
              {bio ? <div dangerouslySetInnerHTML={{ __html: bio }} /> : null}
            </div>

            {/* Contact/Address Column */}
            {(addressTitle || storeAddress || storeEmail) && (
              <div className="flex flex-col gap-6 text-sm leading-[1.6]">
                {addressTitle && (
                  <div className="text-sm font-semibold">{addressTitle}</div>
                )}
                <div className="space-y-2">
                  <div className="space-y-2">
                    {storeAddress && <p>{storeAddress}</p>}
                    {storeEmail && <p>Email: {storeEmail}</p>}
                  </div>
                  <div className="flex gap-3">
                    {SOCIAL_ACCOUNTS.map(({ to, name, Icon }) => (
                      <Link
                        key={name}
                        to={to}
                        target="_blank"
                        className="flex items-center justify-center rounded-full border border-line-subtle p-1.5"
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Newsletter Column (Conditional) */}
            {showNewsletterSignup && (
              <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-1">
                <div className="text-base">{newsletterTitle}</div>
                <div className="space-y-2">
                  <p>{newsletterDescription}</p>
                  <fetcher.Form
                    action="/api/klaviyo"
                    method="POST"
                    encType="multipart/form-data"
                  >
                    <div className="flex">
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder={newsletterPlaceholder}
                        className="grow border border-gray-100 px-3 focus-visible:outline-hidden"
                      />
                      <Button
                        variant="custom"
                        type="submit"
                        loading={fetcher.state === "submitting"}
                      >
                        {newsletterButtonText}
                      </Button>
                    </div>
                  </fetcher.Form>
                  <div className="h-8">
                    {error && (
                      <div className="mb-6 flex w-fit gap-1 bg-red-100 px-2 py-1 text-red-700">
                        <p className="font-semibold">ERROR:</p>
                        <p>{error}</p>
                      </div>
                    )}
                    {message && (
                      <div className="mb-6 w-fit py-1 text-green-500">
                        {message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="w-full border-t border-line-subtle" />
        <FooterMenu />
        <div className="w-full border-t border-line-subtle" />
        <div className="flex flex-col gap-6 py-6 md:flex-row md:flex-wrap md:justify-between lg:flex-nowrap lg:items-center">
          {/* Country Selector - Order 1 on mobile/tablet, Order 2 on desktop */}
          <div className="order-1 flex items-center gap-6 lg:order-2">
            <CompanyLocationSelector />
            <CountrySelector />
          </div>

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
            className="order-3 md:w-full lg:order-1 lg:w-auto"
            dangerouslySetInnerHTML={{ __html: copyright }}
          />
        </div>
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
                  className="group relative items-center gap-2 text-sm"
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

function CompanyLocationSelector() {
  const { company, companyLocationId, setModalOpen } = useB2BLocation();

  const locations = company?.locations?.edges
    ? company.locations.edges.map(
        (location: CustomerCompanyLocationConnection) => {
          return { ...location.node };
        },
      )
    : [];

  if (locations.length <= 1 || !company) {
    return null;
  }

  const selectedLocation =
    locations.find(
      (companyLocation) => companyLocation.id === companyLocationId,
    ) || locations[0];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-body-subtle">Company location:</span>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex w-fit items-center gap-2 rounded-full border border-line-subtle px-3 py-1.5 text-sm transition hover:border-body hover:bg-body hover:text-inverse"
      >
        <MapPinIcon className="h-4 w-4" />
        <span>{selectedLocation?.name || "Select Location"}</span>
        <CaretRightIcon className="h-3 w-3" />
      </button>
    </div>
  );
}
