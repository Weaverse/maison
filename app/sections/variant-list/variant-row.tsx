import {
  InfoIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  CartForm,
  Money,
  type OptimisticCart,
  useOptimisticCart,
} from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type {
  CartApiQueryFragment,
  ProductVariantFragment,
  SellingPlanGroupFragment,
} from "storefront-api.generated";
import { Image } from "~/components/image";
import { PurchaseMethodDropdown } from "~/components/product/purchase-method-dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { cn } from "~/utils/cn";
import {
  calculateSellingPlanPrice,
  getSellingPlanById,
} from "~/utils/selling-plan-utils";

const CLICK_DEBOUNCE_MS = 300;

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
  const { bundleBadgeColor } = useThemeSettings();

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
      <div className="space-y-4 md:hidden">
        <div className="flex gap-[14px]">
          {variant.image && (
            <Image
              data={variant.image}
              width={99}
              height={99}
              className="h-[99px] w-[99px] object-cover rounded-xl border border-(--color-line-subtle)"
              alt={variant.image.altText || variantTitle}
            />
          )}
          <div className="flex flex-col justify-start gap-1">
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
              <div
                className="text-sm flex gap-1 items-center"
                style={{ color: bundleBadgeColor }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: bundleBadgeColor }}
                />
                <span>In Stock</span>
              </div>
            )}
            <div className="text-sm">
              <Money data={unitPrice} as="span" withoutTrailingZeros />
              <span>/unit</span>
            </div>
          </div>
        </div>

        {sellingPlanGroups.nodes.length > 0 ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-[230px]">
                <PurchaseMethodDropdown
                  sellingPlanGroups={sellingPlanGroups}
                  selectedPlanId={selectedPlanId}
                  onPlanChange={setSelectedPlanId}
                />
              </div>
              <div className="font-bold text-base">
                <Money data={totalPrice} as="span" withoutTrailingZeros />
              </div>
            </div>
            <div className="flex justify-start items-center">
              <QuantityUpdateButtons
                cart={resolvedCart}
                variant={variant}
                selectedPlanId={selectedPlanId}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex justify-start items-center">
              <QuantityUpdateButtons
                cart={resolvedCart}
                variant={variant}
                selectedPlanId={selectedPlanId}
              />
            </div>
            <div className="font-bold text-base text-right">
              <Money data={totalPrice} as="span" withoutTrailingZeros />
            </div>
          </div>
        )}
      </div>

      {/* tablet layout */}
      <div
        className={cn(
          "hidden md:grid lg:hidden grid-cols-[1fr_150px_160px] gap-6 items-center",
        )}
      >
        <div className="flex items-start gap-3.5">
          {variant.image && (
            <Image
              data={variant.image}
              width={99}
              height={99}
              className="h-[99px] w-[99px] object-cover rounded-xl border border-(--color-line-subtle)"
              alt={variant.image.altText || variantTitle}
            />
          )}
          <div className="flex flex-1 flex-col justify-center gap-4">
            <div className="space-y-1">
              <div className="font-semibold text-base">{variantTitle}</div>
              <div className="text-base">SKU: {variant.sku}</div>
              {isOutOfStock ? (
                <div className="font-medium text-[12px] text-red-600">
                  Out of Stock
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-1.5 text-[12px] text-orange-600">
                  <InfoIcon size={14} />
                  <span>Low in Stock</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 text-[12px]"
                  style={{ color: bundleBadgeColor }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: bundleBadgeColor }}
                  />
                  <span>In Stock</span>
                </div>
              )}
            </div>
            {sellingPlanGroups.nodes.length > 0 && (
              <div className="w-[230px]">
                <PurchaseMethodDropdown
                  sellingPlanGroups={sellingPlanGroups}
                  selectedPlanId={selectedPlanId}
                  onPlanChange={setSelectedPlanId}
                />
              </div>
            )}
            <QuantityUpdateButtons
              cart={resolvedCart}
              variant={variant}
              selectedPlanId={selectedPlanId}
            />
          </div>
        </div>

        <div className="text-center text-base">
          <Money data={unitPrice} as="span" withoutTrailingZeros />
          <span>/unit</span>
        </div>
        <div className="text-right font-semibold text-base">
          <Money data={totalPrice} as="span" withoutTrailingZeros />
        </div>
      </div>

      {/* desktop layout */}
      <div
        className={cn(
          "hidden lg:grid gap-6 items-center",
          sellingPlanGroups.nodes.length > 0
            ? "grid-cols-[1fr_230px_280px_200px_153px]"
            : "grid-cols-[1fr_280px_200px_153px]",
        )}
      >
        <div className="flex items-center gap-3.5">
          {variant.image && (
            <Image
              data={variant.image}
              width={99}
              height={99}
              className="h-[99px] w-[99px] object-cover rounded-xl border border-(--color-line-subtle)"
              alt={variant.image.altText || variantTitle}
            />
          )}
          <div className="space-y-1">
            <div className="font-semibold text-base">{variantTitle}</div>
            <div className="text-base">SKU: {variant.sku}</div>
            {isOutOfStock ? (
              <div className="font-medium text-[12px] text-red-600">
                Out of Stock
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-1.5 text-[12px] text-orange-600">
                <InfoIcon size={14} />
                <span>Low in Stock</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 text-[12px]"
                style={{ color: bundleBadgeColor }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: bundleBadgeColor }}
                />
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
        <div className="text-center text-base">
          <Money data={unitPrice} as="span" withoutTrailingZeros />
          <span>/unit</span>
        </div>
        <div className="text-right font-semibold text-base">
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
  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);
  const increment = variant.quantityRule.increment || 1;
  const isOutOfStock = !variant.availableForSale;

  const activeLine = cart?.lines?.nodes?.find((line) => {
    const isVariantMatch = line.merchandise.id === variant.id;
    const linePlanId = line.sellingPlanAllocation?.sellingPlan?.id || null;
    const isPlanMatch = linePlanId === selectedPlanId;
    return isVariantMatch && isPlanMatch;
  });

  const fetcherKey = `variant-list-${variant.id}-${selectedPlanId ?? "none"}`;
  const fetcher = useFetcher({ key: fetcherKey });

  const serverQuantity = activeLine?.quantity ?? 0;
  const [pendingDelta, setPendingDelta] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayQuantity = Math.max(0, serverQuantity + pendingDelta);

  function submitCart(action: string, inputs: Record<string, unknown>) {
    const formData = new FormData();
    formData.append(CartForm.INPUT_NAME, JSON.stringify({ action, inputs }));
    fetcher.submit(formData, { method: "POST", action: "/cart" });
  }

  // Latest-closure ref: reassigned every render so deferred callers (debounce
  // timer, retry effect) always invoke a flush bound to the freshest state.
  const flushRef = useRef<(() => void) | null>(null);
  flushRef.current = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (pendingDelta === 0) {
      return;
    }
    if (fetcher.state !== "idle") {
      // Wait for the in-flight submission; the retry effect calls back in.
      return;
    }

    const target = Math.max(0, serverQuantity + pendingDelta);

    if (!activeLine || activeLine.isOptimistic) {
      if (pendingDelta > 0) {
        submitCart(CartForm.ACTIONS.LinesAdd, {
          lines: [
            {
              merchandiseId: variant.id,
              quantity: pendingDelta,
              selectedVariant: variant,
              sellingPlanId: selectedPlanId || undefined,
            },
          ],
        });
      }
    } else if (target === 0) {
      submitCart(CartForm.ACTIONS.LinesRemove, { lineIds: [activeLine.id] });
    } else {
      submitCart(CartForm.ACTIONS.LinesUpdate, {
        lines: [{ id: activeLine.id, quantity: target }],
      });
    }
    setPendingDelta(0);
  };

  function scheduleFlush() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(
      () => flushRef.current?.(),
      CLICK_DEBOUNCE_MS,
    );
  }

  // If a flush was deferred because the fetcher was busy, retry once it idles.
  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      pendingDelta !== 0 &&
      !debounceRef.current
    ) {
      flushRef.current?.();
    }
  }, [fetcher.state, pendingDelta]);

  const [inputValue, setInputValue] = useState(String(displayQuantity));

  useEffect(() => {
    setInputValue(String(displayQuantity));
  }, [displayQuantity]);

  function handleQuantityInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  function handleQuantityInputBlur() {
    let newQuantity = Number.parseInt(inputValue, 10);
    if (Number.isNaN(newQuantity)) {
      newQuantity = displayQuantity;
    }
    newQuantity = Math.max(0, newQuantity);

    if (newQuantity !== displayQuantity) {
      setPendingDelta(newQuantity - serverQuantity);
      scheduleFlush();
    }
    setInputValue(String(newQuantity));
  }

  function handleQuantityInputKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Enter") {
      handleQuantityInputBlur();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setInputValue(String(displayQuantity));
      (e.target as HTMLInputElement).blur();
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function handleIncrement() {
    setPendingDelta((d) => d + increment);
    scheduleFlush();
  }

  function handleDecrement() {
    setPendingDelta((d) => Math.max(-serverQuantity, d - increment));
    scheduleFlush();
  }

  function handleRemove() {
    if (!activeLine || activeLine.isOptimistic) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setPendingDelta(0);
    submitCart(CartForm.ACTIONS.LinesRemove, {
      lineIds: [activeLine.id],
    });
  }

  const showTrashButton = Boolean(activeLine) && displayQuantity > 0;

  return (
    <div className="flex items-center gap-3">
      <VolumePricingInfo variant={variant} />
      <div className="flex h-[45px] w-[180px] max-w-full items-center divide-x divide-(--color-line) rounded-(--btn-border-radius) border border-(--color-line) text-base">
        <button
          type="button"
          aria-label="Decrease quantity"
          className="flex h-full shrink-0 items-center justify-center px-4 transition disabled:cursor-not-allowed disabled:text-body-subtle"
          disabled={displayQuantity <= 0}
          onClick={handleDecrement}
        >
          <MinusIcon className="size-4" aria-hidden="true" />
        </button>

        <input
          type="number"
          className="h-full min-w-0 grow basis-16 bg-transparent px-2 text-center text-base focus:outline-none"
          data-test="item-quantity"
          value={inputValue}
          onChange={handleQuantityInputChange}
          onBlur={handleQuantityInputBlur}
          onKeyDown={handleQuantityInputKeyDown}
          min={0}
        />

        <button
          type="button"
          aria-label="Increase quantity"
          className="flex h-full shrink-0 items-center justify-center px-4 transition disabled:cursor-not-allowed disabled:text-body-subtle"
          disabled={isOutOfStock}
          onClick={handleIncrement}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
      {showTrashButton ? (
        <button
          type="button"
          aria-label="Remove from cart"
          className="flex h-4 w-4 items-center justify-center border-none hover:text-red-600 transition"
          onClick={handleRemove}
        >
          <span className="sr-only">Remove</span>
          <TrashIcon aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : (
        <div className="w-4" />
      )}
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
