import {
  CircleNotchIcon,
  GiftIcon,
  TagIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { CartForm, Money, type OptimisticCart } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Skeleton } from "~/components/skeleton";
import { getCartDiscounts } from "~/utils/cart-discounts";
import {
  DiscountDialog,
  GiftCardDialog,
  NoteDialog,
} from "./cart-summary-actions";

type Layouts = "page" | "drawer";

export function CartSummary({
  cart,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cart: OptimisticCart<CartApiQueryFragment>;
  layout: Layouts;
}) {
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

  const { total: discountTotal } = getCartDiscounts(cart);
  const subtotalValue = Number(cost?.subtotalAmount?.amount || 0);
  const totalValue = Number(cost?.totalAmount?.amount || 0);
  const hasDiscount = subtotalValue > totalValue && totalValue > 0;

  // show loading state for optimistic line item changes or pending cart actions
  const isCartUpdating =
    isOptimistic ||
    dcApplyFetcher.state !== "idle" ||
    dcRemoveFetcher.state !== "idle" ||
    gcRemoveFetcher.state !== "idle" ||
    lineRemoveFetcher.state !== "idle";

  return (
    <div
      className={clsx(
        layout === "drawer" && "grid gap-4 border-line-subtle border-t pt-4",
        layout === "page" &&
          "z-[1] grid h-fit w-full gap-5 rounded-2xl bg-white p-6 lg:sticky lg:top-(--height-nav)",
      )}
    >
      {layout === "page" ? (
        <div className="grid gap-6">
          <h2 className="font-semibold text-base">Order Summary</h2>
          <div className="h-px w-full bg-line-subtle" />
          <dl className="flex items-start gap-2.5 text-base leading-none">
            <dt className="min-w-0 grow">Subtotal</dt>
            <dd className="shrink-0 whitespace-nowrap">
              {isCartUpdating ? (
                <Skeleton className="h-4 w-20 rounded" />
              ) : cost?.subtotalAmount?.amount ? (
                <Money data={cost.subtotalAmount} />
              ) : (
                "-"
              )}
            </dd>
          </dl>
          {discountTotal > 0 && cost?.subtotalAmount && (
            <dl className="flex items-start gap-2.5 text-base leading-none">
              <dt className="min-w-0 grow">Discount</dt>
              <dd className="shrink-0 whitespace-nowrap">
                {isCartUpdating ? (
                  <Skeleton className="h-4 w-20 rounded" />
                ) : (
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
                )}
              </dd>
            </dl>
          )}
          <p className="text-base text-body-subtle/80 leading-[1.6]">
            Shipping and taxes will be calculated at checkout.
          </p>
          <div className="h-px w-full bg-line-subtle" />
          <dl className="flex items-start gap-2.5 font-semibold text-base leading-[1.6]">
            <dt className="min-w-0 grow">Total</dt>
            <dd className="shrink-0 whitespace-nowrap">
              {isCartUpdating ? (
                <Skeleton className="h-4 w-20 rounded" />
              ) : cost?.totalAmount?.amount ? (
                <Money data={cost.totalAmount} />
              ) : (
                "-"
              )}
            </dd>
          </dl>
        </div>
      ) : (
        <>
          <h2 className="sr-only">Order Summary</h2>
          <div className="grid gap-3">
            <dl className="grid gap-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="font-semibold text-base uppercase">Subtotal</dt>
                {isCartUpdating ? (
                  <Skeleton className="h-4 w-20 rounded" />
                ) : (
                  <dd className="flex items-center gap-2 text-base">
                    {hasDiscount && (
                      <span className="font-medium text-body-subtle/80 text-sm line-through">
                        <Money data={cost?.subtotalAmount} />
                      </span>
                    )}
                    <span className="font-semibold">
                      {cost?.totalAmount?.amount ? (
                        <Money data={cost?.totalAmount} />
                      ) : (
                        "-"
                      )}
                    </span>
                  </dd>
                )}
              </div>
            </dl>
            <p className="text-body-subtle/80 text-sm">
              Shipping and taxes will be calculated at checkout.
            </p>
          </div>
        </>
      )}

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
                className="flex items-center justify-center gap-2 rounded-md bg-gray-200 px-2 py-1.5 [&>form]:flex"
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
                  route="/cart"
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
                  className="flex items-center justify-center gap-2 px-2 py-1 rounded-md bg-(--color-header-bg) [&>form]:flex"
                >
                  <TagIcon className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="leading-normal">{discount.code}</span>
                  <CartForm
                    route="/cart"
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

      {/* action buttons */}
      {actionCount > 0 && (
        <div
          className={clsx(
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
                  className={clsx(
                    "px-3 py-2 text-sm font-normal rounded border-0",
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
                  className="rounded border-0 px-3 py-2 font-normal text-sm"
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
                  className={clsx(
                    "px-3 py-2 text-sm font-normal rounded border-0",
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
