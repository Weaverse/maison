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
import { toggleCartDrawer } from "~/components/layout/cart-drawer";
import { useSelectedLocale } from "~/hooks/use-locale";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { desktopVariantGrid } from "~/sections/variant-list/grid";
import { cn } from "~/utils/cn";

type SubtotalProps = {
  cart: any;
  variants: ProductVariantFragment[];
  /** Mirrors the table header: the purchase method column only exists with selling plans. */
  hasPurchaseMethod?: boolean;
};

export function Subtotal({
  cart: originalCart,
  variants,
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

  if (cart?.lines?.nodes) {
    const currentProductLines = cart.lines.nodes.filter((line) =>
      currentProductVariantIds.includes(line.merchandise.id),
    );
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
                  <Money data={{ amount: String(subtotal), currencyCode }} />
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
                <Money data={{ amount: String(subtotal), currencyCode }} />
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
              <Money data={{ amount: String(subtotal), currencyCode }} />
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
