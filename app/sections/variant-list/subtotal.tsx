import { CircleNotchIcon, TrashIcon } from "@phosphor-icons/react";
import { CartForm, Money, useOptimisticCart } from "@shopify/hydrogen";
import type { CurrencyCode } from "@shopify/hydrogen/storefront-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import { type FetcherWithComponents, useFetcher } from "react-router";
import type {
  CartApiQueryFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Button } from "~/components/button";
import {
  useB2BLinesTotal,
  useProductRecalculating,
} from "~/components/cart/b2b-cart-pricing";
import { toggleCartDrawer } from "~/components/layout/cart-drawer";
import { Skeleton } from "~/components/skeleton";
import { useSelectedLocale } from "~/hooks/use-locale";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { desktopVariantGrid } from "~/sections/variant-list/grid";
import { cn } from "~/utils/cn";

type SubtotalProps = {
  cart: any;
  variants: ProductVariantFragment[];
  productId: string;
  /** Mirrors the table header: the purchase method column only exists with selling plans. */
  hasPurchaseMethod?: boolean;
};

/**
 * The subtotal, or a spinner laid over it while it is being recalculated.
 *
 * The figure stays in flow but invisible rather than being swapped out: an
 * svg is a different size from the text it replaces, so swapping makes the
 * row change height on every quantity change.
 */
function SubtotalAmount({
  subtotal,
  currencyCode,
  recalculating,
}: {
  subtotal: number;
  currencyCode: CurrencyCode;
  recalculating: boolean;
}) {
  const amount = <Money data={{ amount: String(subtotal), currencyCode }} />;
  if (!recalculating) {
    return amount;
  }
  // Same placeholder as every other price in the list: one fixed bar rather
  // than the shape of the figure it covers, held in a cell kept open to its
  // width. See `PriceWithCompare` in `variant-row.tsx`.
  return (
    <span className="relative block">
      <span className="invisible block" aria-hidden="true">
        {amount}
      </span>
      {/* A block covering the cell, with the bar as an inline child: it is
          then placed by the cell's own `text-align`, so it lands exactly where
          the figure it replaces would — centred under a centred column header,
          right under a right-aligned one — and every row in a column puts its
          bar at the same x. Anchoring the bar to the figures instead made a
          row carrying a struck-through compare-at price sit wider than its
          neighbours and pushed its bar out of line. */}
      <span className="absolute inset-0">
        <Skeleton
          as="span"
          className="inline-block h-full w-16 rounded"
          aria-label="Updating subtotal"
        />
      </span>
    </span>
  );
}

export function Subtotal({
  cart: originalCart,
  variants,
  productId,
  hasPurchaseMethod = false,
}: SubtotalProps) {
  const { t } = useTranslation();
  const locale = useSelectedLocale();
  let totalItems = 0;
  let subtotal = 0;
  let currencyCode: CurrencyCode = locale.currency as CurrencyCode;
  let existingLineIds: string[] = [];
  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);

  const currentProductVariantIds = variants.map((v) => v.id);
  const currentProductLines = (cart?.lines?.nodes ?? []).filter((line) =>
    currentProductVariantIds.includes(line.merchandise.id),
  );
  // This table totals one product, not the whole cart, so the cart-wide B2B
  // subtotal cannot be used — only the lines on screen.
  const b2bTotal = useB2BLinesTotal(currentProductLines);
  // Only when this product is moving. The table totals one product, so a
  // change elsewhere in the cart leaves this figure alone.
  const recalculating = useProductRecalculating(productId);

  if (cart?.lines?.nodes) {
    existingLineIds = currentProductLines.map((line) => line.id);

    totalItems = currentProductLines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    );
    subtotal = currentProductLines.reduce((sum, line) => {
      const amount = Number.parseFloat(line.cost?.totalAmount.amount || "0");
      return sum + amount;
    }, 0);
    currencyCode =
      currentProductLines[0]?.cost?.totalAmount?.currencyCode ?? currencyCode;
  }

  if (b2bTotal) {
    subtotal = b2bTotal.amount;
    currencyCode = b2bTotal.currency as CurrencyCode;
  }

  return (
    <>
      {/* mobile layout */}
      <div className="border-t border-line-subtle pt-6 md:hidden">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => toggleCartDrawer(true)}
            >
              {t("cart.viewCart")}
            </Button>
            {<RemoveAllFromCartButton lineIds={existingLineIds} />}
          </div>
          <div className="space-y-6 text-body-subtle">
            <div className="text-sm">
              {t("cart.totalItems", { count: totalItems })}
            </div>
            <div className="space-y-1">
              <div className="">
                <div className="text-sm">{t("cart.subtotalLabel")}</div>
                <div className="font-semibold">
                  <SubtotalAmount
                    subtotal={subtotal}
                    currencyCode={currencyCode}
                    recalculating={recalculating}
                  />
                </div>
              </div>
              <div className="">
                <div className="text-xs text-body-subtle">
                  {t("cart.checkoutNote")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* tablet layout */}
      <div className="hidden border-line-subtle border-t pt-6 md:block xl:hidden">
        <div className="flex flex-col gap-3 py-3">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => toggleCartDrawer(true)}>
              {t("cart.viewCart")}
            </Button>
            <RemoveAllFromCartButton lineIds={existingLineIds} />
          </div>
          <div className="flex items-start gap-6">
            <div className="flex flex-1 items-end self-stretch text-base text-body-subtle">
              {t("cart.totalItems", { count: totalItems })}
            </div>
            <div className="flex flex-1 flex-col items-end gap-1 text-right">
              <div className="text-base">{t("cart.subtotalLabel")}</div>
              <div className="font-semibold text-base">
                <SubtotalAmount
                  subtotal={subtotal}
                  currencyCode={currencyCode}
                  recalculating={recalculating}
                />
              </div>
              <div className="text-[12px] text-body-subtle">
                {t("cart.checkoutNote")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* desktop layout */}
      <div className="hidden border-line-subtle border-t pt-[15px] xl:block">
        <div
          className={cn(
            "grid items-center gap-6 py-3",
            desktopVariantGrid(hasPurchaseMethod),
          )}
        >
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => toggleCartDrawer(true)}>
              {t("cart.viewCart")}
            </Button>
            <RemoveAllFromCartButton lineIds={existingLineIds} />
          </div>
          {hasPurchaseMethod && <div />}
          <div className="text-center text-base text-body-subtle">
            {t("cart.totalItems", { count: totalItems })}
          </div>
          <div className="col-span-2 flex flex-col items-end gap-1 text-right">
            <div className="text-base">{t("cart.subtotalLabel")}</div>
            <div className="font-semibold text-base">
              <SubtotalAmount
                subtotal={subtotal}
                currencyCode={currencyCode}
                recalculating={recalculating}
              />
            </div>
            <div className="text-[12px] text-body-subtle">
              {t("cart.checkoutNote")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RemoveAllFromCartButton({ lineIds }: { lineIds: string[] }) {
  const { t } = useTranslation();
  const cartAction = usePrefixPathWithLocale("/cart");
  const fetcher = useFetcher({
    key: "variant-list",
  });

  if (fetcher.state !== "idle") {
    return (
      <div>
        <CircleNotchIcon size={24} className="animate-spin" />
      </div>
    );
  }
  if (!lineIds.length) {
    return null;
  }

  return (
    <CartForm
      route={cartAction}
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
      fetcherKey="variant-list"
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <Button
          className="flex items-center gap-1 text-base"
          variant="underline"
          type="submit"
          disabled={fetcher.state !== "idle"}
        >
          <TrashIcon className="size-4" aria-hidden="true" />
          <span>{t("product.removeAll")}</span>
        </Button>
      )}
    </CartForm>
  );
}
