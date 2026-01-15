import { CircleNotchIcon, TrashIcon } from "@phosphor-icons/react";
import { CartForm, useOptimisticCart } from "@shopify/hydrogen";
import { type FetcherWithComponents, useFetcher } from "react-router";
import type {
  CartApiQueryFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Button } from "~/components/button";
import { toggleCartDrawer } from "~/components/layout/cart-drawer";

type SubtotalProps = {
  cart: any;
  variants: ProductVariantFragment[];
};

export function Subtotal({ cart: originalCart, variants }: SubtotalProps) {
  let totalItems = 0;
  let subtotal = 0;
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
              View Cart
            </Button>
            {<RemoveAllFromCartButton lineIds={existingLineIds} />}
          </div>
          <div className="space-y-6">
            <div className="text-sm">Total: {totalItems} items</div>
            <div className="space-y-1">
              <div className="">
                <div className="text-sm">Subtotal:</div>
                <div className="font-semibold">${subtotal.toFixed(2)}</div>
              </div>
              <div className="">
                <div className="text-xs text-body-subtle">
                  Taxes, discounts and shipping calculated at checkout.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* tablet layout */}
      <div className="hidden md:block lg:hidden border-t border-line-subtle pt-6">
        <div className="grid grid-cols-[3fr_1fr_1fr] gap-4 items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => toggleCartDrawer(true)}
            >
              View Cart
            </Button>
            {<RemoveAllFromCartButton lineIds={existingLineIds} />}
          </div>
          <div className="space-y-1 col-span-2">
            <div className="text-right">
              <div className="text-sm">Subtotal:</div>
              <div className="font-semibold">${subtotal.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-body-subtle">
                Taxes, discounts and shipping calculated at checkout.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* desktop layout */}
      <div className="hidden lg:block border-t border-line-subtle pt-6">
        <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => toggleCartDrawer(true)}
            >
              View Cart
            </Button>
            {<RemoveAllFromCartButton lineIds={existingLineIds} />}
          </div>
          <div className="text-center text-sm">Total: {totalItems} items</div>
          <div className="col-span-2">
            <div className="text-right space-y-1">
              <div className="text-sm">Subtotal:</div>
              <div className="font-semibold text-sm">
                ${subtotal.toFixed(2)}
              </div>
              <div className="text-xs text-body-subtle">
                Taxes, discounts and shipping calculated at checkout.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RemoveAllFromCartButton({ lineIds }: { lineIds: string[] }) {
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
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
      fetcherKey="variant-list"
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <Button
          className="flex items-center gap-1 text-sm"
          variant="underline"
          type="submit"
          disabled={fetcher.state !== "idle"}
        >
          <TrashIcon /> <span className="text-sm">Remove All</span>
        </Button>
      )}
    </CartForm>
  );
}
