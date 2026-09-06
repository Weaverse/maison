import { CircleNotchIcon, TagIcon, XIcon } from "@phosphor-icons/react";
import { CartForm, Money, type OptimisticCart } from "@shopify/hydrogen";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Banner } from "~/components/banner";
import { Button } from "~/components/button";
import { getCartDiscounts, getDiscountAmount } from "~/utils/cart-discounts";

/**
 * Promo code card shown under the order summary on the cart page. The drawer
 * keeps using the dialog in `cart-summary-actions.tsx`; only the page layout
 * gets the inline form the design calls for.
 */
export function CartDiscount({
  cart,
  canApply,
}: {
  cart: OptimisticCart<CartApiQueryFragment>;
  canApply: boolean;
}) {
  const discountCodes = cart?.discountCodes ?? [];
  const money = cart?.cost?.subtotalAmount;
  const { byCode } = getCartDiscounts(cart);
  const [code, setCode] = useState("");
  const [removingCode, setRemovingCode] = useState<string | null>(null);
  const applyFetcher = useFetcher({ key: "discount-code-apply" });
  const removeFetcher = useFetcher({ key: "discount-code-remove" });

  const appliedCodes = discountCodes.filter((discount) => discount.applicable);
  const isApplying = applyFetcher.state !== "idle";
  const submitted = Boolean(code && !isApplying && applyFetcher.data);
  const isApplied = appliedCodes.some(
    (discount) => discount.code.toLowerCase() === code.trim().toLowerCase(),
  );

  // Clear the field once the code shows up as an applied chip, so the input
  // never sits next to a chip repeating the same code.
  useEffect(() => {
    if (isApplied) {
      setCode("");
    }
  }, [isApplied]);

  if (!(canApply || appliedCodes.length)) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const discountCode = code.trim();
    if (!discountCode) {
      return;
    }
    applyFetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify({
          action: CartForm.ACTIONS.DiscountCodesUpdate,
          inputs: {
            discountCodes: [
              ...appliedCodes.map((discount) => discount.code),
              discountCode,
            ],
          },
        }),
      },
      { method: "POST", action: "/cart" },
    );
  }

  return (
    <div className="grid gap-4 rounded-2xl bg-white p-6">
      {canApply && (
        <form onSubmit={handleSubmit} className="flex items-start gap-3">
          <label htmlFor="cart-discount-code" className="sr-only">
            Promo code
          </label>
          <input
            id="cart-discount-code"
            type="text"
            name="discountCode"
            value={code}
            placeholder="Promo code"
            onChange={(event) => {
              setCode(event.target.value);
              applyFetcher.data = null;
            }}
            className="min-w-0 grow rounded-(--btn-border-radius) border border-(--color-line) px-3 py-[18px] text-base leading-none placeholder:text-body-subtle focus:outline-none"
          />
          <Button
            type="submit"
            variant="outline"
            className="shrink-0 [--spinner-duration:400ms]"
            loading={isApplying}
            disabled={isApplying}
          >
            Apply
          </Button>
        </form>
      )}

      {submitted && !isApplied && (
        <Banner variant="error">Invalid discount code.</Banner>
      )}

      {appliedCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {appliedCodes.map((discount) => {
            const remainingCodes = appliedCodes
              .map((applied) => applied.code)
              .filter((applied) => applied !== discount.code);
            const isRemoving =
              removeFetcher.state !== "idle" && removingCode === discount.code;
            const amount = getDiscountAmount(byCode, discount.code);

            return (
              <div
                key={discount.code}
                className="flex items-center gap-2 rounded bg-(--color-header-bg) px-2 py-1 text-body-subtle text-xs [&>form]:flex"
              >
                <TagIcon className="size-4" aria-hidden="true" />
                <span className="inline-flex items-center gap-1 leading-none">
                  <span>{discount.code}</span>
                  {amount !== null && money && (
                    <span className="inline-flex items-center">
                      (-
                      <Money
                        as="span"
                        withoutTrailingZeros
                        data={{ ...money, amount: String(amount) }}
                      />
                      )
                    </span>
                  )}
                </span>
                <CartForm
                  route="/cart"
                  action={CartForm.ACTIONS.DiscountCodesUpdate}
                  inputs={{ discountCodes: remainingCodes }}
                  fetcherKey="discount-code-remove"
                >
                  <button
                    type="submit"
                    className="relative size-3.5 transition-colors hover:text-red-600"
                    aria-label={`Remove discount code ${discount.code}`}
                    onClick={() => setRemovingCode(discount.code)}
                  >
                    {isRemoving ? (
                      <CircleNotchIcon size={14} className="animate-spin" />
                    ) : (
                      <XIcon
                        className="size-3.5"
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
    </div>
  );
}
