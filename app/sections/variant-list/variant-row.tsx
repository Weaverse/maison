import { Info, Trash } from "@phosphor-icons/react";
import {
  CartForm,
  OptimisticInput,
  useOptimisticData,
  type OptimisticCart,
} from "@shopify/hydrogen";
import { Await, useRouteLoaderData } from "react-router";
import type {
  CartApiQueryFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Image } from "~/components/image";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";

interface VariantRowProps {
  variant: ProductVariantFragment;
  onRemove: () => void;
  enableAutoUpdate?: boolean;
}

export function VariantRow({
  variant,
  onRemove,
  enableAutoUpdate = false,
}: VariantRowProps) {
  const rootData = useRouteLoaderData<RootLoader>("root");

  const variantTitle = variant.title === "Default Title" ? "" : variant.title;
  const unitPrice = variant.price?.amount
    ? Number.parseFloat(variant.price.amount)
    : 0;

  const isLowStock =
    variant.quantityAvailable !== null &&
    variant.quantityAvailable !== undefined &&
    variant.quantityAvailable > 0 &&
    variant.quantityAvailable <= 10;
  const isOutOfStock = !variant.availableForSale;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center",
        isOutOfStock && "opacity-50",
      )}
    >
      <div className="flex items-center gap-3">
        {variant.image && (
          <Image
            data={variant.image}
            width={64}
            height={64}
            className="h-16 w-16 object-cover rounded"
            alt={variant.image.altText || variantTitle}
          />
        )}
        <div className="space-y-1">
          <div className="font-medium">{variantTitle}</div>
          <div className="text-sm text-body/70">SKU: {variant.sku}</div>
          {isOutOfStock ? (
            <div className="text-sm text-red-600 font-medium">Out of Stock</div>
          ) : isLowStock ? (
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <Info size={14} />
              <span>Low in Stock</span>
            </div>
          ) : (
            <div className="text-sm text-green-600">In Stock</div>
          )}
        </div>
      </div>
      <Await resolve={rootData.cart}>
        {(resolvedCart) => (
          <QuantityUpdateButtons cart={resolvedCart} variant={variant} />
        )}
      </Await>

      <div className="text-right w-32">
        <div className="font-medium">${unitPrice.toFixed(2)}/unit</div>
      </div>

      <Await resolve={rootData.cart}>
        {(resolvedCart) => {
          const cartLine = resolvedCart?.lines?.nodes?.find(
            (line) => line.merchandise.id === variant.id,
          );
          const cartQuantity = cartLine?.quantity || 0;
          const totalPrice = unitPrice * cartQuantity;

          return (
            <div className="flex items-center justify-end gap-3 w-32">
              <div className="text-right font-bold">
                ${totalPrice.toFixed(2)}
              </div>
              {cartQuantity > 0 && (
                <button
                  type="button"
                  aria-label="Remove variant"
                  className="text-body/50 hover:text-red-600 transition"
                  onClick={onRemove}
                >
                  <Trash size={18} />
                </button>
              )}
            </div>
          );
        }}
      </Await>
    </div>
  );
}

interface QuantityUpdateButtonsProps {
  variant: ProductVariantFragment;
  cart: OptimisticCart<CartApiQueryFragment>;
}

function QuantityUpdateButtons({ variant, cart }: QuantityUpdateButtonsProps) {
  type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];
  type OptimisticData = {
    action?: string;
    quantity?: number;
  };

  const existingLine = cart?.lines?.nodes?.find(
    (line) => line.merchandise.id === variant.id,
  );

  const optimisticData = useOptimisticData<OptimisticData>(existingLine?.id);
  const currentQuantity = existingLine?.quantity || 0;
  const optimisticQuantity = optimisticData?.quantity || currentQuantity;

  const prevQuantity = Number(Math.max(0, optimisticQuantity - 1).toFixed(0));
  const nextQuantity = Number((optimisticQuantity + 1).toFixed(0));
  const isOutOfStock = !variant.availableForSale;

  if (existingLine) {
    // Update existing line in cart
    return (
      <div className="flex items-center border border-line-subtle">
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesUpdate}
          inputs={{ lines: [{ id: existingLine.id, quantity: prevQuantity }] }}
        >
          <button
            type="submit"
            name="decrease-quantity"
            aria-label="Decrease quantity"
            className="h-9 w-9 transition disabled:cursor-not-allowed disabled:text-body-subtle"
            value={prevQuantity}
            disabled={optimisticQuantity <= 1 || existingLine.isOptimistic}
          >
            <span>&#8722;</span>
            <OptimisticInput
              id={existingLine.id}
              data={{ quantity: prevQuantity }}
            />
          </button>
        </CartForm>

        <div className="px-2 text-center" data-test="item-quantity">
          {optimisticQuantity}
        </div>

        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesUpdate}
          inputs={{ lines: [{ id: existingLine.id, quantity: nextQuantity }] }}
        >
          <button
            type="submit"
            className="h-9 w-9 transition disabled:cursor-not-allowed disabled:text-body-subtle"
            name="increase-quantity"
            value={nextQuantity}
            aria-label="Increase quantity"
            disabled={existingLine.isOptimistic}
          >
            <span>&#43;</span>
            <OptimisticInput
              id={existingLine.id}
              data={{ quantity: nextQuantity }}
            />
          </button>
        </CartForm>
      </div>
    );
  }

  // Add new item to cart
  return (
    <div className="flex items-center border border-line-subtle">
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesAdd}
        inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1 }] }}
      >
        <button
          type="submit"
          className="h-9 w-9 transition disabled:cursor-not-allowed disabled:text-body-subtle"
          disabled={isOutOfStock}
        >
          <span>&#43;</span>
        </button>
      </CartForm>
    </div>
  );
}
