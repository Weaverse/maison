import { InfoIcon, TrashIcon } from "@phosphor-icons/react";
import {
  CartForm,
  Money,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";

interface VariantRowProps {
  variant: ProductVariantFragment;
  enableAutoUpdate?: boolean;
}

export function VariantRow({
  variant,
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
        "grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 items-center",
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
              <InfoIcon size={14} />
              <span>Low in Stock</span>
            </div>
          ) : (
            <div className="text-sm text-green-600 flex gap-1 items-center">
              <span className="bg-green-600 size-2 rounded-full" />
              <span>In Stock</span>
            </div>
          )}
        </div>
      </div>
      <Await resolve={rootData.cart}>
        {(resolvedCart) => (
          <QuantityUpdateButtons cart={resolvedCart} variant={variant} />
        )}
      </Await>

      <div className="font-medium text-center">
        ${unitPrice.toFixed(2)}/unit
      </div>

      <Await resolve={rootData.cart}>
        {(resolvedCart) => {
          const cartLine = resolvedCart?.lines?.nodes?.find(
            (line) => line.merchandise.id === variant.id,
          );
          const cartQuantity = cartLine?.quantity || 0;
          const totalPrice = unitPrice * cartQuantity;

          return (
            <div className="text-right font-semibold">
              ${totalPrice.toFixed(2)}
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

  // Use the same UI for both existing and new items
  const lineId = existingLine?.id || variant.id;
  const showTrashButton = !!existingLine;

  return (
    <div className="flex items-center gap-3">
      <VolumePricingInfo variant={variant} />
      <div className="flex items-center border border-border divide-x divide-border rounded-(--btn-border-radius)">
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesUpdate}
          inputs={{
            lines: [{ id: existingLine?.id, quantity: prevQuantity }],
          }}
        >
          <button
            type="submit"
            name="decrease-quantity"
            aria-label="Decrease quantity"
            className="h-9 w-9 transition disabled:cursor-not-allowed disabled:text-body-subtle"
            value={prevQuantity}
            disabled={
              optimisticQuantity <= 1 ||
              existingLine?.isOptimistic ||
              !existingLine
            }
          >
            <span>&#8722;</span>
            <OptimisticInput
              id={existingLine?.id}
              data={{ quantity: prevQuantity }}
            />
          </button>
        </CartForm>

        <div
          className="px-2 w-16 h-9 flex items-center justify-center"
          data-test="item-quantity"
        >
          {optimisticQuantity}
        </div>

        {existingLine ? (
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesUpdate}
            inputs={{
              lines: [{ id: existingLine.id, quantity: nextQuantity }],
            }}
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
        ) : (
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
        )}
      </div>

      {showTrashButton && (
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesRemove}
          inputs={{ lineIds: [existingLine.id] }}
        >
          <button
            type="submit"
            aria-label="Remove from cart"
            className="flex h-8 w-8 items-center justify-center border-none hover:text-red-600 transition"
          >
            <span className="sr-only">Remove</span>
            <TrashIcon aria-hidden="true" className="h-4 w-4" />
            <OptimisticInput id={existingLine.id} data={{ action: "remove" }} />
          </button>
        </CartForm>
      )}
    </div>
  );
}

function VolumePricingInfo({ variant }: { variant: ProductVariantFragment }) {
  const volumes = variant.quantityPriceBreaks;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InfoIcon className="cursor-pointer hover:scale-125 duration-300" />
      </TooltipTrigger>
      <TooltipContent
        className="bg-white text-body shadow-md rounded-md p-2 space-y-2"
        side="left"
        sideOffset={5}
        arrow={false}
      >
        {volumes.nodes.map((node, ind) => (
          <div key={ind} className="flex items-center gap-2 justify-between">
            <span>{node.minimumQuantity}+</span>
            <span>
              <Money data={node.price} />
            </span>
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
