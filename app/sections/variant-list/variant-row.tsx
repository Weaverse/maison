import { InfoIcon, TrashIcon } from "@phosphor-icons/react";
import {
  CartForm,
  Money,
  OptimisticInput,
  useOptimisticCart,
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
}

export function VariantRow({ variant }: VariantRowProps) {
  const rootData = useRouteLoaderData<RootLoader>("root");

  const variantTitle = variant.title === "Default Title" ? "" : variant.title;

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
        {(resolvedCart) => {
          const cartLine = resolvedCart?.lines?.nodes?.find(
            (line) => line.merchandise.id === variant.id,
          );
          let unitPrice = cartLine
            ? cartLine.cost?.amountPerQuantity
            : variant.price;
          const totalPrice = cartLine?.cost?.totalAmount || {
            amount: "0",
            currencyCode: variant.price?.currencyCode,
          };

          return (
            <>
              <QuantityUpdateButtons cart={resolvedCart} variant={variant} />
              <div className="font-medium text-center">
                <Money data={unitPrice} as="span" withoutTrailingZeros />
                <span>/unit</span>
              </div>
              <div className="text-right font-semibold">
                <Money data={totalPrice} as="span" withoutTrailingZeros />
              </div>
            </>
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

function QuantityUpdateButtons({
  variant,
  cart: originalCart,
}: QuantityUpdateButtonsProps) {
  type OptimisticData = {
    action?: string;
    quantity?: number;
  };

  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);

  const increment = variant.quantityRule.increment || 1;

  const existingLine = cart?.lines?.nodes?.find(
    (line) => line.merchandise.id === variant.id,
  );

  const optimisticId = existingLine?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);

  const currentQuantity =
    optimisticData?.quantity || existingLine?.quantity || 0;

  const prevQuantity = Number(Math.max(0, currentQuantity - increment));
  const nextQuantity = Number(currentQuantity + increment);
  const isOutOfStock = !variant.availableForSale;

  const showTrashButton = Boolean(existingLine);

  return (
    <div className="flex items-center gap-3">
      <VolumePricingInfo variant={variant} />
      <div className="flex items-center border border-border divide-x divide-border rounded-(--btn-border-radius)">
        <CartForm
          route="/cart"
          fetcherKey="variant-list"
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
              currentQuantity <= 0 ||
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
          {currentQuantity}
        </div>

        {existingLine ? (
          <CartForm
            route="/cart"
            fetcherKey="variant-list"
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
            fetcherKey="variant-list"
            action={CartForm.ACTIONS.LinesAdd}
            inputs={{
              lines: [
                {
                  merchandiseId: variant.id,
                  quantity: increment,
                  selectedVariant: variant,
                },
              ],
            }}
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
      <div className="w-8">
        {showTrashButton && (
          <CartForm
            route="/cart"
            fetcherKey="variant-list"
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
              <OptimisticInput
                id={existingLine.id}
                data={{ action: "remove" }}
              />
            </button>
          </CartForm>
        )}
      </div>
    </div>
  );
}

function VolumePricingInfo({ variant }: { variant: ProductVariantFragment }) {
  const volumes = [
    {
      minimumQuantity: 1,
      price: variant.price,
    },
    ...variant.quantityPriceBreaks.nodes,
  ];
  const rule = variant.quantityRule;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InfoIcon className="cursor-pointer hover:scale-125 duration-300" />
      </TooltipTrigger>
      <TooltipContent
        className="bg-white text-body shadow-lg rounded-lg p-0"
        side="left"
        sideOffset={5}
        arrow={false}
      >
        <div className="py-3 px-5 space-y-1">
          <div className="font-semibold">
            Min {rule.minimum} {rule.maximum ? `- Max ${rule.maximum}` : ""}
          </div>
          <div>Increments of {rule.increment}</div>
        </div>
        <ul className="space-y-1">
          {volumes.map((node, ind) => (
            <li
              key={ind}
              className="flex items-center gap-6 justify-between odd:bg-gray-100 py-2.5 px-5"
            >
              <span>{node.minimumQuantity}+</span>
              <div>
                <Money data={node.price} as="span" withoutTrailingZeros />
                <span className="ml-1">{node.price.currencyCode}/ea</span>
              </div>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
