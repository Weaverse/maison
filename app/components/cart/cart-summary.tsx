import {
  CircleNotchIcon,
  GiftIcon,
  TagIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { CartForm, Money, type OptimisticCart } from "@shopify/hydrogen";
import type { CurrencyCode } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import { useState } from "react";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { useB2BPricing } from "~/components/cart/b2b-cart-pricing";
import { Skeleton } from "~/components/skeleton";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { getCartDiscounts } from "~/utils/cart-discounts";
import { cn } from "~/utils/cn";
import {
  DiscountDialog,
  GiftCardDialog,
  NoteDialog,
} from "./cart-summary-actions";

type Layouts = "page" | "drawer";

/**
 * A figure in the summary, and the placeholder that stands in for it while the
 * cart is being recalculated.
 *
 * The placeholder is laid over the figure rather than swapped in for it. Swapped
 * in, a 16px box replaced a line of `text-base` type — around 22px, more where a
 * struck-through price sits beside it — so every row shrank the moment a
 * quantity changed and grew back when the answer came, taking the tax note and
 * the buttons under it along. Holding the real figure in flow but invisible
 * keeps the row exactly its own height, and the bar is one fixed size wherever
 * it appears.
 */
function AmountPlaceholder({
  loading,
  className,
  children,
}: {
  loading: boolean;
  /** The layout the figures need, kept on the copy held in flow. */
  className?: string;
  children: React.ReactNode;
}) {
  // The same wrapper in both branches. The drawer's `dd` hands its
  // `flex items-center gap-2` down here so the copy held in flow keeps the
  // row's shape; returning the children bare once the figures arrived dropped
  // it, and the struck-through price lost the 8px it had sat at.
  if (!loading) {
    return className ? <span className={className}>{children}</span> : children;
  }
  return (
    <span className="relative block">
      <span className={cn("invisible", className)} aria-hidden="true">
        {children}
      </span>
      {/* A block over the whole cell with the bar as an inline child, so the
          bar lands where the figure's own alignment puts it. */}
      <span className="absolute inset-0 text-right">
        <Skeleton
          as="span"
          className="inline-block h-full w-16 rounded"
          aria-label="Updating amount"
        />
      </span>
    </span>
  );
}

export function CartSummary({
  cart,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cart: OptimisticCart<CartApiQueryFragment>;
  layout: Layouts;
}) {
  const { t } = useTranslation();
  const cartAction = usePrefixPathWithLocale("/cart");
  const {
    enableCartNote,
    cartNoteButtonText,
    enableDiscountCode,
    discountCodeButtonText,
    enableGiftCard,
    giftCardButtonText,
  } = useThemeSettings();

  const [removingDiscountCode, setRemovingDiscountCode] = useState<
    string | null
  >(null);
  const [removingGiftCard, setRemovingGiftCard] = useState<string | null>(null);
  const dcApplyFetcher = useFetcher({ key: "discount-code-apply" });
  const dcRemoveFetcher = useFetcher({ key: "discount-code-remove" });
  const gcRemoveFetcher = useFetcher({ key: "gift-card-remove" });
  // Line removal submits with this stable fetcherKey. The CartLineItem that
  // owns the trash button unmounts the moment the line is optimistically
  // spliced out, so its own fetcher response would be lost. Reading the keyed
  // fetcher here (CartSummary stays mounted while the cart has items) keeps
  // the fetcher alive so revalidation completes and cost stays in sync.
  const lineRemoveFetcher = useFetcher({ key: "cart-line-remove" });

  const { cost, discountCodes, isOptimistic, appliedGiftCards, note } = cart;

  // On the cart page the discount code moved into its own card below the
  // summary, so only the drawer still triggers the dialog from here.
  const showDiscountTrigger = enableDiscountCode && layout === "drawer";
  const actionCount = [
    enableCartNote,
    showDiscountTrigger,
    enableGiftCard,
  ].filter(Boolean).length;

  const { state: b2bState } = useB2BPricing();
  const { total: discountTotal, lineLevel } = getCartDiscounts(cart);
  // `cost.subtotalAmount` is already net of line-level discounts, so a code
  // scoped to specific products would otherwise be subtracted twice. Adding
  // them back gives the pre-discount figure, and the rows then read
  // Subtotal - Discount = Total for cart-level and line-level codes alike.
  const subtotalValue = Number(cost?.subtotalAmount?.amount || 0) + lineLevel;
  const totalValue = Number(cost?.totalAmount?.amount || 0);
  const shopifySubtotal = cost?.subtotalAmount
    ? { ...cost.subtotalAmount, amount: String(subtotalValue) }
    : null;

  // When B2Bridge prices the cart it owns every money figure in this summary.
  // Shopify's `cost` is still computed from Shopify's prices, so leaving any
  // of it on screen puts two different arithmetics side by side — which is
  // how a $4,550 line ends up under a $6,500 subtotal.
  //
  // B2Bridge's subtotal excludes tax, shipping and Shopify discount codes, so
  // the subtotal and the total are the same number here. A cart-level discount
  // code is not reflected while B2B pricing is on; the pilot does not cover
  // them, and Shopify applies them at checkout.
  const b2bMoney =
    b2bState?.status === "priced"
      ? {
          amount: String(b2bState.subtotal),
          currencyCode: b2bState.currency as CurrencyCode,
        }
      : null;
  // `unavailable` is the other half of that problem: B2Bridge is still the
  // authority but could not answer, so every line price renders an em dash
  // instead of Shopify's. Falling back here would leave the retail subtotal as
  // the only number on screen, directly under a notice saying wholesale
  // pricing is unavailable. Both have to stay silent, and with the same mark
  // the lines use.
  const b2bSilent = b2bState?.status === "unavailable";
  const noMoneyLabel = b2bSilent ? "\u2014" : "-";
  const subtotalMoney = b2bMoney ?? (b2bSilent ? null : shopifySubtotal);
  const totalMoney =
    b2bMoney ?? (b2bSilent ? null : (cost?.totalAmount ?? null));
  // Comparing a B2B subtotal against a Shopify total would strike through a
  // price that was never offered.
  const hasDiscount =
    !(b2bMoney || b2bSilent) && subtotalValue > totalValue && totalValue > 0;

  // show loading state for optimistic line item changes or pending cart actions
  const isCartUpdating =
    isOptimistic ||
    dcApplyFetcher.state !== "idle" ||
    dcRemoveFetcher.state !== "idle" ||
    gcRemoveFetcher.state !== "idle" ||
    lineRemoveFetcher.state !== "idle";

  // Both chip groups in one place so the drawer can show them above the
  // subtotal, as the design has them, while the cart page keeps them below.
  const appliedCodes = (
    <>
      {/* applied gift cards display */}
      {appliedGiftCards?.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {appliedGiftCards.map((giftCard) => {
            const isGCRemoving =
              gcRemoveFetcher.state !== "idle" &&
              removingGiftCard === giftCard.lastCharacters;
            return (
              <div
                key={giftCard.id}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-2 py-1.5 [&>form]:flex"
              >
                <GiftIcon className="h-4.5 w-4.5" aria-hidden="true" />
                <div className="flex items-center gap-1 leading-normal">
                  <span>***{giftCard.lastCharacters}</span>
                  <span className="inline-flex items-center">
                    (-
                    <Money data={giftCard.amountUsed} />)
                  </span>
                </div>
                <CartForm
                  route={cartAction}
                  action={CartForm.ACTIONS.GiftCardCodesRemove}
                  inputs={{
                    giftCardCodes: [giftCard.id],
                  }}
                  fetcherKey="gift-card-remove"
                >
                  <button
                    type="submit"
                    className="relative ml-1 size-4 transition-colors hover:text-red-600"
                    aria-label={`Remove gift card code ${giftCard.id}`}
                    onClick={() => setRemovingGiftCard(giftCard.lastCharacters)}
                  >
                    {isGCRemoving ? (
                      <CircleNotchIcon size={16} className="animate-spin" />
                    ) : (
                      <XIcon
                        className="size-4"
                        weight="regular"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </CartForm>
              </div>
            );
          })}
        </div>
      )}

      {/* applied discount codes display */}
      {layout === "drawer" && discountCodes?.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {discountCodes
            .filter((discount) => discount.applicable)
            .map((discount) => {
              const codes = discountCodes
                .filter((d) => d.applicable)
                .map((d) => d.code);
              const updatedCodes = codes.filter((c) => c !== discount.code);
              const isDCRemoving =
                dcRemoveFetcher.state !== "idle" &&
                removingDiscountCode === discount.code;

              return (
                <div
                  key={discount.code}
                  className="flex items-center justify-center gap-2 px-2 py-1 rounded-lg bg-(--color-header-bg) [&>form]:flex"
                >
                  <TagIcon className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="leading-normal">{discount.code}</span>
                  <CartForm
                    route={cartAction}
                    action={CartForm.ACTIONS.DiscountCodesUpdate}
                    inputs={{ discountCodes: updatedCodes || [] }}
                    fetcherKey="discount-code-remove"
                  >
                    <button
                      type="submit"
                      className="relative ml-1 size-4 transition-colors hover:text-red-600"
                      aria-label={`Remove discount code ${discount.code}`}
                      onClick={() => setRemovingDiscountCode(discount.code)}
                    >
                      {isDCRemoving ? (
                        <CircleNotchIcon size={16} className="animate-spin" />
                      ) : (
                        <XIcon
                          className="size-4"
                          weight="regular"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </CartForm>
                </div>
              );
            })}
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        layout === "drawer" && "grid gap-4 border-line-subtle border-t pt-4",
        layout === "page" &&
          "z-[1] grid h-fit w-full gap-5 rounded-2xl bg-white p-6 lg:sticky lg:top-(--height-nav)",
      )}
    >
      {layout === "drawer" && appliedCodes}
      {layout === "page" ? (
        <div className="grid gap-6">
          {/* `h2` picks up the serif heading face from the global rule; at 14px
              beside sans body text that reads as the wrong font. */}
          <h2 className="font-sans font-semibold text-base">
            {t("cart.orderSummary")}
          </h2>
          <div className="h-px w-full bg-line-subtle" />
          <dl className="flex items-start gap-2.5 text-base leading-none">
            <dt className="min-w-0 grow">{t("cart.subtotal")}</dt>
            <dd className="shrink-0 whitespace-nowrap">
              <AmountPlaceholder loading={isCartUpdating}>
                {subtotalMoney ? <Money data={subtotalMoney} /> : noMoneyLabel}
              </AmountPlaceholder>
            </dd>
          </dl>
          {discountTotal > 0 && cost?.subtotalAmount && !b2bSilent && (
            <dl className="flex items-start gap-2.5 text-base leading-none">
              <dt className="min-w-0 grow">{t("cart.discount")}</dt>
              <dd className="shrink-0 whitespace-nowrap">
                <AmountPlaceholder loading={isCartUpdating}>
                  <span className="inline-flex items-center">
                    -
                    <Money
                      as="span"
                      withoutTrailingZeros
                      data={{
                        ...cost.subtotalAmount,
                        amount: String(discountTotal),
                      }}
                    />
                  </span>
                </AmountPlaceholder>
              </dd>
            </dl>
          )}
          <p className="text-base text-body-subtle/80 leading-[1.6]">
            {t("cart.taxNote")}
          </p>
          <div className="h-px w-full bg-line-subtle" />
          <dl className="flex items-start gap-2.5 font-semibold text-base leading-[1.6]">
            <dt className="min-w-0 grow">{t("cart.total")}</dt>
            <dd className="shrink-0 whitespace-nowrap">
              <AmountPlaceholder loading={isCartUpdating}>
                {totalMoney?.amount ? (
                  <Money data={totalMoney} />
                ) : (
                  noMoneyLabel
                )}
              </AmountPlaceholder>
            </dd>
          </dl>
        </div>
      ) : (
        <>
          <h2 className="sr-only">{t("cart.orderSummary")}</h2>
          <div className="grid gap-3">
            <dl className="grid gap-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="font-semibold text-base uppercase">
                  {t("cart.subtotal")}
                </dt>
                {/* The `dd` stays in the document while the figures are
                    worked out: a `dl` whose `dt` loses its `dd` is read out as
                    a term with no definition. */}
                <dd className="text-base">
                  <AmountPlaceholder
                    loading={isCartUpdating}
                    className="flex items-center gap-2"
                  >
                    {hasDiscount && (
                      <span className="font-medium text-body-subtle/80 text-sm line-through">
                        <Money data={subtotalMoney} />
                      </span>
                    )}
                    <span className="font-semibold">
                      {totalMoney?.amount ? (
                        <Money data={totalMoney} />
                      ) : (
                        noMoneyLabel
                      )}
                    </span>
                  </AmountPlaceholder>
                </dd>
              </div>
            </dl>
            <p className="text-body-subtle/80 text-sm">{t("cart.taxNote")}</p>
          </div>
        </>
      )}

      {layout === "page" && appliedCodes}

      {/* action buttons */}
      {actionCount > 0 && (
        <div
          className={cn(
            "gap-2",
            layout === "drawer" && "flex items-center justify-end",
            layout === "page" && "grid",
            layout === "page" &&
              (actionCount > 1 ? "grid-cols-2" : "grid-cols-1"),
          )}
        >
          {enableCartNote && (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button
                  variant="secondary"
                  className={cn(
                    "px-3 py-2 text-sm font-normal border-0",
                    layout === "page" && "w-full",
                  )}
                >
                  {cartNoteButtonText}
                </Button>
              </Dialog.Trigger>
              <NoteDialog cartNote={note} layout={layout} />
            </Dialog.Root>
          )}
          {showDiscountTrigger && (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button
                  variant="secondary"
                  className="border-0 px-3 py-2 font-normal text-sm"
                >
                  {discountCodeButtonText}
                </Button>
              </Dialog.Trigger>
              <DiscountDialog discountCodes={discountCodes} layout={layout} />
            </Dialog.Root>
          )}
          {enableGiftCard && (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button
                  variant="secondary"
                  className={cn(
                    "px-3 py-2 text-sm font-normal border-0",
                    layout === "page" && "w-full",
                  )}
                >
                  {giftCardButtonText}
                </Button>
              </Dialog.Trigger>
              <GiftCardDialog
                appliedGiftCards={appliedGiftCards}
                layout={layout}
              />
            </Dialog.Root>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
