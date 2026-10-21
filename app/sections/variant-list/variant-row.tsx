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
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type {
  CartApiQueryFragment,
  ProductVariantFragment,
  SellingPlanGroupFragment,
} from "storefront-api.generated";
import {
  useB2BLinePrice,
  useB2BPricing,
  useB2BProductRate,
  useProductRecalculating,
} from "~/components/cart/b2b-cart-pricing";
import { Image } from "~/components/image";
import { PurchaseMethodDropdown } from "~/components/product/purchase-method-dropdown";
import { Skeleton } from "~/components/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import {
  desktopVariantGrid,
  VARIANT_GRID_TABLET,
} from "~/sections/variant-list/grid";
import { cn } from "~/utils/cn";
import {
  calculateSellingPlanPrice,
  getSellingPlanById,
} from "~/utils/selling-plan-utils";

const CLICK_DEBOUNCE_MS = 300;

interface VariantRowProps {
  variant: ProductVariantFragment;
  cart: OptimisticCart<CartApiQueryFragment>;
  /** The product these variants belong to; tiers are reached on its total. */
  productId: string;
  sellingPlanGroups: { nodes: SellingPlanGroupFragment[] };
}

type MoneyData = React.ComponentProps<typeof Money>["data"];

/**
 * A price, with the price it replaced struck through beside it.
 *
 * Volume tiers are easy to miss: the number simply changes when the quantity
 * crosses a threshold, and nothing says it has. Showing what the unit used to
 * cost makes the saving legible at the moment it is earned, in the same shape
 * the cart already uses for an applied discount.
 */
function PriceWithCompare({
  price,
  compareAt,
  recalculating,
  suffix,
}: {
  price: MoneyData;
  compareAt: MoneyData | null;
  /** The figures shown belong to the previous quantity. */
  recalculating?: boolean;
  /** Rendered after the price, e.g. "/unit". Kept inside so the cell keeps
      its full width while the spinner stands in for it. */
  suffix?: React.ReactNode;
}) {
  const { saleBadgeColor } = useThemeSettings();

  const settled = (
    <>
      {compareAt && (
        <span
          className="font-normal line-through"
          style={{ color: saleBadgeColor }}
        >
          <Money data={compareAt} as="span" withoutTrailingZeros />
        </span>
      )}
      <Money data={price} as="span" withoutTrailingZeros />
      {suffix}
    </>
  );

  if (!recalculating) {
    if (!compareAt) {
      return settled;
    }
    return (
      <span className="inline-flex items-baseline gap-1.5">{settled}</span>
    );
  }

  // The placeholder is laid over the figures it replaces rather than swapped
  // in for them: keeping the old content in flow but invisible holds the cell
  // at exactly its own size, so the column does not jump and `/unit` does not
  // wrap while the price is worked out.
  return (
    <span className="relative inline-flex items-baseline gap-1.5">
      <span className="invisible" aria-hidden="true">
        {settled}
      </span>
      <Skeleton
        as="span"
        className="absolute inset-0 rounded"
        aria-label="Updating price"
      />
    </span>
  );
}

export function VariantRow({
  variant,
  cart: resolvedCart,
  productId,
  sellingPlanGroups,
}: VariantRowProps) {
  const { t } = useTranslation();
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

  const b2bLine = useB2BLinePrice(activeCartLine?.id ?? "");
  const { state: b2bState } = useB2BPricing();
  // The whole product: a tier is reached on its combined quantity, so moving
  // one row reprices every row in the table, including the ones at zero that
  // would join at the new price.
  const recalculating = useProductRecalculating(productId);
  const productRate = useB2BProductRate(productId);
  const b2bCurrency = b2bState?.status === "priced" ? b2bState.currency : null;

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

  let totalPrice = activeCartLine?.cost?.totalAmount || {
    amount: "0",
    currencyCode: variant.price?.currencyCode as any,
  };

  // A variant sitting in the cart is priced by B2Bridge, and its tier depends
  // on the quantity — so the per-unit figure here moves with the stepper
  // rather than staying at the list price. A variant at quantity zero is not
  // in the cart and has no B2B price to show.
  //
  // Selling plans are left alone: a subscription price is Shopify's to
  // compute, and B2Bridge's cart pricing does not model one.
  let compareUnitPrice: MoneyData | null = null;
  let compareTotalPrice: MoneyData | null = null;

  if (b2bLine && !selectedPlanId) {
    const currencyCode = b2bCurrency as typeof variant.price.currencyCode;
    unitPrice = { amount: String(b2bLine.unitPrice), currencyCode };
    if (activeCartLine) {
      totalPrice = {
        amount: String(b2bLine.unitPrice * activeCartLine.quantity),
        currencyCode,
      };
    }

    // Only once a tier has actually taken effect. Below the first threshold
    // B2Bridge returns Shopify's own price for both figures, and striking
    // through a number equal to the one beside it reads as a saving that is
    // not there.
    if (b2bLine.unitPrice < b2bLine.originalUnitPrice) {
      compareUnitPrice = {
        amount: String(b2bLine.originalUnitPrice),
        currencyCode,
      };
      if (activeCartLine) {
        compareTotalPrice = {
          amount: String(b2bLine.originalUnitPrice * activeCartLine.quantity),
          currencyCode,
        };
      }
    }
  } else if (productRate && !selectedPlanId && variant.price) {
    // Not in the cart, but a sibling variant has already taken this product
    // past a tier. Leaving the list price here reads as "this one is
    // excluded" next to a sibling that is plainly discounted, when in fact
    // B2Bridge would price it at the same rate the moment it is added.
    //
    // Measured against Shopify's price, not against `variant.price`: the PDP
    // loader has already replaced that with B2Bridge's base price, and a rate
    // that includes the base discount applied to a number that already
    // carries it discounts the base twice. On the measured 3% base + 5% tier
    // rule that showed 290.51 where B2Bridge charges 299.49.
    const original = (variant as { b2bOriginalPrice?: MoneyData })
      .b2bOriginalPrice;
    const listMoney = original ?? variant.price;
    const list = Number(listMoney.amount);
    const { currencyCode } = variant.price;
    unitPrice = {
      amount: (Math.round(list * (1 - productRate) * 100) / 100).toFixed(2),
      currencyCode,
    };
    compareUnitPrice = { amount: listMoney.amount, currencyCode };
  }

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
                {t("product.outOfStock")}
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-1 text-sm text-orange-600">
                <InfoIcon size={14} />
                <span>{t("product.lowInStock")}</span>
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
                <span>{t("search.inStock")}</span>
              </div>
            )}
            <div className="text-sm">
              <PriceWithCompare
                price={unitPrice}
                compareAt={compareUnitPrice}
                recalculating={recalculating}
                suffix={<span>/unit</span>}
              />
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
                <PriceWithCompare
                  price={totalPrice}
                  compareAt={compareTotalPrice}
                  recalculating={recalculating}
                />
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
              <PriceWithCompare
                price={totalPrice}
                compareAt={compareTotalPrice}
                recalculating={recalculating}
              />
            </div>
          </div>
        )}
      </div>

      {/* tablet layout */}
      <div
        className={cn(
          "hidden md:grid xl:hidden gap-6 items-center",
          VARIANT_GRID_TABLET,
        )}
      >
        <div className="flex min-w-0 items-start gap-3.5">
          {variant.image && (
            <Image
              data={variant.image}
              width={99}
              height={99}
              className="h-[99px] w-[99px] shrink-0 object-cover rounded-xl border border-(--color-line-subtle)"
              alt={variant.image.altText || variantTitle}
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
            <div className="space-y-1">
              <div className="font-semibold text-base">{variantTitle}</div>
              <div className="text-base">SKU: {variant.sku}</div>
              {isOutOfStock ? (
                <div className="font-medium text-[12px] text-red-600">
                  {t("product.outOfStock")}
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-1.5 text-[12px] text-orange-600">
                  <InfoIcon size={14} />
                  <span>{t("product.lowInStock")}</span>
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
                  <span>{t("search.inStock")}</span>
                </div>
              )}
            </div>
            {sellingPlanGroups.nodes.length > 0 && (
              <div className="w-full max-w-[230px]">
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
          <PriceWithCompare
            price={unitPrice}
            compareAt={compareUnitPrice}
            recalculating={recalculating}
            suffix={<span>/unit</span>}
          />
        </div>
        <div className="text-right font-semibold text-base">
          <PriceWithCompare
            price={totalPrice}
            compareAt={compareTotalPrice}
            recalculating={recalculating}
          />
        </div>
      </div>

      {/* desktop layout */}
      <div
        className={cn(
          "hidden xl:grid gap-6 items-center",
          desktopVariantGrid(sellingPlanGroups.nodes.length > 0),
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
                {t("product.outOfStock")}
              </div>
            ) : isLowStock ? (
              <div className="flex items-center gap-1.5 text-[12px] text-orange-600">
                <InfoIcon size={14} />
                <span>{t("product.lowInStock")}</span>
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
                <span>{t("search.inStock")}</span>
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
          <PriceWithCompare
            price={unitPrice}
            compareAt={compareUnitPrice}
            recalculating={recalculating}
            suffix={<span>/unit</span>}
          />
        </div>
        <div className="text-right font-semibold text-base">
          <PriceWithCompare
            price={totalPrice}
            compareAt={compareTotalPrice}
            recalculating={recalculating}
          />
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
  const { t } = useTranslation();
  const cartAction = usePrefixPathWithLocale("/cart");
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
    fetcher.submit(formData, { method: "POST", action: cartAction });
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
      // Blurring runs `handleQuantityInputBlur` on its own; calling it here as
      // well ran the whole commit twice off one keystroke. The same fix as in
      // `cart.tsx` — kept identical so the two steppers cannot drift.
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
      {/* Hover doubles the frame and both dividers with an inset shadow
          rather than a wider border: growing the border eats into the content
          box and shoves the stepper 2px sideways, which reads as a flicker.
          A shadow paints over the same pixels, costs no layout, and fades. */}
      <div className="flex h-[45px] w-[180px] max-w-full items-center divide-x divide-(--color-line) rounded-(--btn-border-radius) border border-(--color-line) text-base transition-shadow duration-200 ease-out [&>*]:transition-shadow [&>*]:duration-200 [&>*]:ease-out hover:shadow-[inset_0_0_0_1px_var(--color-line)] hover:[&>*:not(:last-child)]:shadow-[inset_-1px_0_0_var(--color-line)]">
        <button
          type="button"
          aria-label={t("product.decreaseQuantity")}
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
          aria-label={t("product.increaseQuantity")}
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
          aria-label={t("cart.removeFromCart")}
          className="flex h-4 w-4 items-center justify-center border-none hover:text-red-600 transition"
          onClick={handleRemove}
        >
          <span className="sr-only">{t("cart.removeItem")}</span>
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
