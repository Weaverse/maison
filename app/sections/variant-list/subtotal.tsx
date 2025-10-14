import { TrashIcon } from "@phosphor-icons/react";
import { CartForm } from "@shopify/hydrogen";
import type { FetcherWithComponents } from "react-router";
import type { ProductVariantFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { toggleCartDrawer } from "~/components/layout/cart-drawer";

type SubtotalProps = {
  cart: any;
  variants: ProductVariantFragment[];
};

export function Subtotal({ cart, variants }: SubtotalProps) {
  let totalItems = 0;
  let subtotal = 0;
  let existingLineIds: string[] = [];

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
      const amount = Number.parseFloat(line.cost.totalAmount.amount);
      return sum + amount;
    }, 0);
  }
  return (
    <div className="border-t border-line pt-6">
      <div className="grid grid-cols-[3fr_1fr_2fr] gap-4 items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => toggleCartDrawer(true)}>
            View Cart
          </Button>
          <RemoveAllFromCartButton lineIds={existingLineIds} />
        </div>
        <div className="text-center">Total: {totalItems} items</div>
        <div className="space-y-1">
          <div className="text-right">
            <div className="text-sm">Subtotal:</div>
            <div className="font-semibold">${subtotal.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-body-subtle">
              Taxes, discounts and shipping calculated at checkout.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RemoveAllFromCartButton({ lineIds }: { lineIds: string[] }) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <Button
          className="flex items-center gap-1"
          variant="underline"
          type="submit"
          disabled={fetcher.state !== "idle"}
        >
          <TrashIcon /> <span>Remove All</span>
        </Button>
      )}
    </CartForm>
  );
}
