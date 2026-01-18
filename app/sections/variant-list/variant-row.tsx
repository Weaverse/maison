import { InfoIcon, TrashIcon } from "@phosphor-icons/react";
import {
  CartForm,
  Money,
  type OptimisticCart,
  OptimisticInput,
  useOptimisticCart,
  useOptimisticData,
} from "@shopify/hydrogen";
import { useState } from "react";
import type {
  CartApiQueryFragment,
  ProductVariantFragment,
  SellingPlanGroupFragment,
} from "storefront-api.generated";
import { Minus, Plus } from "~/components/icons";
import { Image } from "~/components/image";
import { AddToCartAnalytics } from "~/components/product/add-to-cart-button";
import { PurchaseMethodDropdown } from "~/components/product/purchase-method-dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { cn } from "~/utils/cn";
import {
  calculateSellingPlanPrice,
  getSellingPlanById,
} from "~/utils/selling-plan-utils";

interface VariantRowProps {
  variant: ProductVariantFragment;
  cart: OptimisticCart<CartApiQueryFragment>;
  sellingPlanGroups: { nodes: SellingPlanGroupFragment[] };
}

export function VariantRow({
  variant,
  cart: resolvedCart,
  sellingPlanGroups,
}: VariantRowProps) {
  const initialCartLine = resolvedCart?.lines?.nodes?.find(
    (line) => line.merchandise.id === variant.id,
  );

  const initialPlanId =
    initialCartLine?.sellingPlanAllocation?.sellingPlan?.id || null;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    initialPlanId,
  );

  const activeCartLine = resolvedCart?.lines?.nodes?.find((line) => {
    const isVariantMatch = line.merchandise.id === variant.id;
    const linePlanId = line.sellingPlanAllocation?.sellingPlan?.id || null;
    const isPlanMatch = linePlanId === selectedPlanId;
    return isVariantMatch && isPlanMatch;
  });

  const variantTitle = variant.title === "Default Title" ? "" : variant.title;

  const isLowStock =
    variant.quantityAvailable !== null &&
    variant.quantityAvailable !== undefined &&
    variant.quantityAvailable > 0 &&
    variant.quantityAvailable <= 10;
  const isOutOfStock = !variant.availableForSale;

  let basePrice = activeCartLine
    ? activeCartLine.cost?.amountPerQuantity
    : variant.price;
  let unitPrice = basePrice;

  if (selectedPlanId && variant.price) {
    const selectedPlan = getSellingPlanById(sellingPlanGroups, selectedPlanId);
    if (selectedPlan) {
      unitPrice = calculateSellingPlanPrice(variant.price, selectedPlan) as any;
    }
  }

  const totalPrice = activeCartLine?.cost?.totalAmount || {
    amount: "0",
    currencyCode: variant.price?.currencyCode as any,
  };

  return (
    <div className={cn(isOutOfStock && "opacity-50")}>
      {/* mobile layout */}
      <div className="space-y-6 md:hidden">
        <div className="flex gap-[14px]">
          {variant.image && (
            <Image
              data={variant.image}
              width={99}
              height={99}
              className="h-[99px] w-[99px] object-cover rounded border border-(--color-line-subtle)"
              alt={variant.image.altText || variantTitle}
            />
          )}
          <div className="flex flex-col justify-between">
            <div className="font-semibold text-sm">{variantTitle}</div>
            <div className="text-sm text-body/70">SKU: {variant.sku}</div>
            {isOutOfStock ? (
              <div className="text-sm text-red-600 font-medium">
                Out of Stock
              </div>
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
            <div className="text-sm">
              <Money data={unitPrice} as="span" withoutTrailingZeros />
              <span>/unit</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <QuantityUpdateButtons
            cart={resolvedCart}
            variant={variant}
            selectedPlanId={selectedPlanId}
          />
          <div className="font-semibold text-sm">
            <Money data={totalPrice} as="span" withoutTrailingZeros />
          </div>
        </div>

        {sellingPlanGroups.nodes.length > 0 && (
          <div className="mt-3">
            <PurchaseMethodDropdown
              sellingPlanGroups={sellingPlanGroups}
              selectedPlanId={selectedPlanId}
              onPlanChange={setSelectedPlanId}
            />
          </div>
        )}
      </div>

      {/* tablet layout */}
      <div
        className={cn(
          "hidden md:grid lg:hidden grid-cols-[3fr_2fr_1fr_1fr] gap-6 items-center",
        )}
      >
        <div className="flex items-start gap-3">
          {variant.image && (
            <Image
              data={variant.image}
              width={99}
              height={99}
              className="h-[99px] w-[99px] object-cover rounded border border-(--color-line-subtle)"
              alt={variant.image.altText || variantTitle}
            />
          )}
          <div className="flex-1 flex flex-col gap-[23px]">
            <div className="space-y-1">
              <div className="font-medium">{variantTitle}</div>
              <div className="text-sm text-body/70">SKU: {variant.sku}</div>
              {isOutOfStock ? (
                <div className="text-sm text-red-600 font-medium">
                  Out of Stock
                </div>
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
            <QuantityUpdateButtons
              cart={resolvedCart}
              variant={variant}
              selectedPlanId={selectedPlanId}
            />
          </div>
        </div>

        {sellingPlanGroups.nodes.length > 0 ? (
          <PurchaseMethodDropdown
            sellingPlanGroups={sellingPlanGroups}
            selectedPlanId={selectedPlanId}
            onPlanChange={setSelectedPlanId}
          />
        ) : (
          <div />
        )}

        <div className="text-center text-sm">
          <Money data={unitPrice} as="span" withoutTrailingZeros />
          <span>/unit</span>
        </div>
        <div className="text-right font-semibold text-sm">
          <Money data={totalPrice} as="span" withoutTrailingZeros />
        </div>
      </div>

      {/* desktop layout */}
      <div
        className={cn(
          "hidden lg:grid gap-6 items-center",
          sellingPlanGroups.nodes.length > 0
            ? "grid-cols-[1fr_280px_270px_160px_153px]"
            : "grid-cols-[1fr_270px_160px_153px]",
        )}
      >
        <div className="flex items-center gap-3.5">
          {variant.image && (
            <Image
              data={variant.image}
              width={99}
              height={99}
              className="h-[99px] w-[99px] object-cover rounded border border-(--color-line-subtle)"
              alt={variant.image.altText || variantTitle}
            />
          )}
          <div className="space-y-1">
            <div className="font-semibold text-sm">{variantTitle}</div>
            <div className="text-sm text-body/70">SKU: {variant.sku}</div>
            {isOutOfStock ? (
              <div className="text-xs text-red-600 font-medium">
                Out of Stock
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <InfoIcon size={14} />
                <span>Low in Stock</span>
              </div>
            ) : (
              <div className="text-xs text-green-600 flex gap-1 items-center">
                <span className="bg-green-600 size-2 rounded-full" />
                <span>In Stock</span>
              </div>
            )}
          </div>
        </div>

        {sellingPlanGroups.nodes.length > 0 && (
          <div className="flex justify-center">
            <PurchaseMethodDropdown
              sellingPlanGroups={sellingPlanGroups}
              selectedPlanId={selectedPlanId}
              onPlanChange={setSelectedPlanId}
            />
          </div>
        )}

        <div className="flex justify-center">
          <QuantityUpdateButtons
            cart={resolvedCart}
            variant={variant}
            selectedPlanId={selectedPlanId}
          />
        </div>
        <div className="text-center text-sm">
          <Money data={unitPrice} as="span" withoutTrailingZeros />
          <span>/unit</span>
        </div>
        <div className="text-right font-semibold text-sm">
          <Money data={totalPrice} as="span" withoutTrailingZeros />
        </div>
      </div>
    </div>
  );
}

interface QuantityUpdateButtonsProps {
  variant: ProductVariantFragment;
  cart: OptimisticCart<CartApiQueryFragment>;
  selectedPlanId: string | null;
}

function QuantityUpdateButtons({
  variant,
  cart: originalCart,
  selectedPlanId,
}: QuantityUpdateButtonsProps) {
  type OptimisticData = {
    action?: string;
    quantity?: number;
  };

  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);

  const increment = variant.quantityRule.increment || 1;

  const activeLine = cart?.lines?.nodes?.find((line) => {
    const isVariantMatch = line.merchandise.id === variant.id;
    const linePlanId = line.sellingPlanAllocation?.sellingPlan?.id || null;
    const isPlanMatch = linePlanId === selectedPlanId;
    return isVariantMatch && isPlanMatch;
  });

  const optimisticId = activeLine?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);

  const currentQuantity = optimisticData?.quantity || activeLine?.quantity || 0;

  const prevQuantity = Number(Math.max(0, currentQuantity - increment));
  const nextQuantity = Number(currentQuantity + increment);
  const isOutOfStock = !variant.availableForSale;

  const showTrashButton = Boolean(activeLine);

  const shouldUpdateActiveLine = Boolean(activeLine);

  return (
    <div className="flex items-center gap-4">
      <VolumePricingInfo variant={variant} />
      <div className="flex items-center border-2 border-(--color-line) divide-x divide-(--color-line) rounded-(--btn-border-radius)">
        <CartForm
          route="/cart"
          fetcherKey="variant-list"
          action={CartForm.ACTIONS.LinesUpdate}
          inputs={{
            lines: [{ id: activeLine?.id, quantity: prevQuantity }],
          }}
        >
          <button
            type="submit"
            name="decrease-quantity"
            aria-label="Decrease quantity"
            className="h-11 w-11 flex items-center justify-center transition disabled:cursor-not-allowed disabled:text-body-subtle"
            value={prevQuantity}
            disabled={
              currentQuantity <= 0 || activeLine?.isOptimistic || !activeLine
            }
          >
            <Minus />
            <OptimisticInput
              id={activeLine?.id}
              data={{ quantity: prevQuantity }}
            />
          </button>
        </CartForm>

        <div
          className="px-2 w-[68px] h-11 flex items-center justify-center text-sm"
          data-test="item-quantity"
        >
          {currentQuantity}
        </div>

        {shouldUpdateActiveLine ? (
          <CartForm
            route="/cart"
            fetcherKey="variant-list"
            action={CartForm.ACTIONS.LinesUpdate}
            inputs={{
              lines: [{ id: activeLine?.id, quantity: nextQuantity }],
            }}
          >
            <button
              type="submit"
              className="h-11 w-11 flex items-center justify-center transition disabled:cursor-not-allowed disabled:text-body-subtle"
              name="increase-quantity"
              value={nextQuantity}
              aria-label="Increase quantity"
              disabled={activeLine?.isOptimistic}
            >
              <Plus />
              <OptimisticInput
                id={activeLine?.id}
                data={{ quantity: nextQuantity }}
              />
            </button>
          </CartForm>
        ) : (
          <AddToCartWithSellingPlan
            variant={variant}
            increment={increment}
            isOutOfStock={isOutOfStock}
            selectedPlanId={selectedPlanId}
          />
        )}
      </div>
      {showTrashButton ? (
        <CartForm
          route="/cart"
          fetcherKey="variant-list"
          action={CartForm.ACTIONS.LinesRemove}
          inputs={{ lineIds: [activeLine?.id] }}
        >
          <button
            type="submit"
            aria-label="Remove from cart"
            className="flex h-4 w-4 items-center justify-center border-none hover:text-red-600 transition"
          >
            <span className="sr-only">Remove</span>
            <TrashIcon aria-hidden="true" className="h-4 w-4" />
            <OptimisticInput id={activeLine?.id} data={{ action: "remove" }} />
          </button>
        </CartForm>
      ) : (
        <div className="w-4" />
      )}
    </div>
  );
}

interface AddToCartWithSellingPlanProps {
  variant: ProductVariantFragment;
  increment: number;
  isOutOfStock: boolean;
  selectedPlanId: string | null;
}

function AddToCartWithSellingPlan({
  variant,
  increment,
  isOutOfStock,
  selectedPlanId,
}: AddToCartWithSellingPlanProps) {
  return (
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
            sellingPlanId: selectedPlanId || undefined,
          },
        ],
      }}
    >
      {(fetcher: any) => (
        <AddToCartAnalytics fetcher={fetcher}>
          <button
            type="submit"
            className="h-11 w-11 flex items-center justify-center transition disabled:cursor-not-allowed disabled:text-body-subtle"
            disabled={isOutOfStock}
          >
            <Plus />
          </button>
        </AddToCartAnalytics>
      )}
    </CartForm>
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
        <InfoIcon className="cursor-pointer hover:scale-125 duration-300 text-body-subtle" />
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
