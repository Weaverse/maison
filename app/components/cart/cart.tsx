import {
  CircleNotchIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  CartForm,
  Money,
  type OptimisticCart,
  OptimisticInput,
  useOptimisticCart,
  useOptimisticData,
} from "@shopify/hydrogen";
import type { CartLineUpdateInput } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { SubscriptionIcon } from "~/components/icons";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { ScrollArea } from "~/components/scroll-area";
import { Section } from "~/components/section";
import { calculateAspectRatio } from "~/utils/image";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CartBestSellers } from "./cart-best-sellers";
import { CartDiscount } from "./cart-discount";
import { CartSummary } from "./cart-summary";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];
type Layouts = "page" | "drawer";

export function Cart({
  layout,
  onClose,
  cart: originalCart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartApiQueryFragment;
}) {
  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = Boolean(cart) && cart.totalQuantity > 0;

  return (
    <>
      {cartHasItems && <CartDetails cart={cart} layout={layout} />}
      <CartEmpty
        hidden={cartHasItems || linesCount}
        onClose={onClose}
        layout={layout}
      />
    </>
  );
}

function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: OptimisticCart<CartApiQueryFragment>;
}) {
  const { enableDiscountCode } = useThemeSettings();
  const content = (
    <div
      className={clsx(
        layout === "drawer" && "flex h-full flex-col px-5",
        layout === "page" && [
          "mx-auto w-full max-w-(--page-width) pb-12",
          "grid lg:grid-cols-[1fr_auto] lg:items-start",
          "gap-6",
        ],
      )}
    >
      <CartLines lines={cart?.lines?.nodes} layout={layout} />
      <div
        className={clsx(
          "space-y-4",
          layout === "drawer" ? "flex-shrink-0" : "self-start lg:w-[360px]",
        )}
      >
        <CartSummary cart={cart} layout={layout}>
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} layout={layout} />
        </CartSummary>
        {layout === "page" && (
          <CartDiscount cart={cart} canApply={Boolean(enableDiscountCode)} />
        )}
      </div>
    </div>
  );

  if (layout === "drawer") {
    return <div className="flex-1 min-h-0">{content}</div>;
  }

  return content;
}

function CartLines({
  layout = "drawer",
  lines: cartLines,
}: {
  layout: Layouts;
  lines: CartLine[];
}) {
  const currentLines = cartLines;
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);

  return (
    <div
      ref={scrollRef}
      className={clsx([
        y > 0 ? "border-line-subtle border-t" : "",
        layout === "page" && "grow rounded-2xl bg-white p-4 sm:p-6",
        layout === "drawer" &&
          "flex-1 min-h-0 overflow-auto transition -mx-5 pb-4",
      ])}
    >
      <ScrollArea className={clsx(layout === "drawer" && "h-full")} size="sm">
        <ul
          className={clsx(
            "grid",
            layout === "page" && "gap-6 divide-y divide-line-subtle",
            layout === "drawer" && "gap-6 px-5",
          )}
        >
          {currentLines.map((line, index) => (
            <CartLineItem
              key={line.id}
              line={line}
              layout={layout}
              className={layout === "page" && index > 0 ? "pt-6" : ""}
            />
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

function CartCheckoutActions({
  checkoutUrl,
  layout,
}: {
  checkoutUrl: string;
  layout: Layouts;
}) {
  if (!checkoutUrl) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {layout === "drawer" && (
        <Link
          to="/cart"
          onClick={() => toggleCartDrawer(false)}
          className="w-full flex items-center justify-center gap-2 py-[18px] px-6 border border-line text-(--btn-outline-text) rounded-(--btn-border-radius) text-base font-normal"
        >
          View Cart
        </Link>
      )}
      <a href={checkoutUrl} target="_self" className="w-full">
        <Button className="w-full bg-(--btn-primary-bg) text-(--btn-primary-text) border-0 py-[18px] px-6 font-normal">
          Checkout
        </Button>
      </a>
      {/* @todo: <CartShopPayButton cart={cart} /> */}
    </div>
  );
}

type OptimisticData = {
  action?: string;
  quantity?: number;
};

function CartLineItem({
  line,
  layout,
  className,
}: {
  line: CartLine;
  layout: Layouts;
  className?: string;
}) {
  const optimisticData = useOptimisticData<OptimisticData>(line?.id);

  if (!line?.id) {
    return null;
  }

  const { id, quantity, merchandise } = line;

  if (typeof quantity === "undefined" || !merchandise?.product) {
    return null;
  }

  let { image, title, product, selectedOptions } = merchandise;
  let url = `/products/${product.handle}`;
  if (selectedOptions?.length) {
    let params = new URLSearchParams();
    for (const option of selectedOptions) {
      params.append(option.name, option.value);
    }
    url += `?${params.toString()}`;
  }
  let isDefaultVariant = false;
  if (selectedOptions?.length === 1) {
    const { name, value } = selectedOptions[0];
    isDefaultVariant = name === "Title" && value === "Default Title";
  }

  // Format variant options with pipe separator
  const formattedVariant = isDefaultVariant
    ? null
    : selectedOptions?.map((opt) => opt.value).join(" | ");

  return (
    <li
      className={clsx(
        "flex",
        layout === "page" ? "gap-3.5 not-last:pb-6 sm:gap-4" : "gap-3 sm:gap-4",
        className,
      )}
      style={{
        // Hide the line item if the optimistic data action is remove
        // Do not remove the form from the DOM
        display: optimisticData?.action === "remove" ? "none" : "flex",
      }}
    >
      <div className="relative shrink-0">
        {image && (
          <Image
            width={250}
            height={250}
            data={image}
            className={clsx(
              "aspect-square h-auto rounded-xl object-cover",
              layout === "page" ? "w-[120px] sm:w-[160px]" : "w-[140px]",
            )}
            alt={title}
            aspectRatio={calculateAspectRatio(image, "adapt")}
          />
        )}
      </div>
      <div className="flex min-w-0 grow flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 space-y-1">
            <div className="font-semibold">
              {product?.handle ? (
                <Link
                  to={url}
                  onClick={() => toggleCartDrawer(false)}
                  className="inline-block break-words transition-opacity hover:opacity-70"
                >
                  {product?.title || ""}
                </Link>
              ) : (
                <p>{product?.title || ""}</p>
              )}
            </div>
            {formattedVariant && (
              <div className="text-base">{formattedVariant}</div>
            )}
            {layout === "page" && (
              <CartLinePrice
                line={line}
                as="span"
                className="mt-2 block md:hidden"
              />
            )}
            {layout === "drawer" &&
              line.sellingPlanAllocation?.sellingPlan?.name && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#EBE8E5] px-2 py-1 text-xs text-body-subtle">
                  <SubscriptionIcon className="h-3 w-3" />
                  <span>{line.sellingPlanAllocation.sellingPlan.name}</span>
                </div>
              )}
          </div>
          {layout === "page" && (
            <ItemRemoveButton lineId={id} className="-mt-1" />
          )}
          {layout === "drawer" && (
            <ItemRemoveButton lineId={id} className="-mt-1.5 -mr-2" />
          )}
        </div>
        <div className="flex flex-col items-start gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2">
          <div className="flex min-w-0 flex-col items-start gap-4 md:flex-row md:items-center md:gap-3">
            <CartLineQuantityAdjust line={line} layout={layout} />
            {layout === "page" &&
              line.sellingPlanAllocation?.sellingPlan?.name && (
                <div className="inline-flex items-center gap-1 rounded-lg bg-[#EBE8E5] px-2 py-1 text-xs text-body-subtle">
                  <SubscriptionIcon className="h-3 w-3" />
                  <span>{line.sellingPlanAllocation.sellingPlan.name}</span>
                </div>
              )}
          </div>
          <CartLinePrice
            line={line}
            as="span"
            className="ml-auto hidden md:block"
          />
        </div>
      </div>
    </li>
  );
}

function ItemRemoveButton({
  lineId,
  className,
}: {
  lineId: CartLine["id"];
  className?: string;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds: [lineId] }}
      fetcherKey="cart-line-remove"
    >
      <button
        className={clsx(
          "flex h-8 w-8 items-center justify-center border-none",
          className,
        )}
        type="submit"
      >
        <span className="sr-only">Remove</span>
        <TrashIcon aria-hidden="true" className="h-4 w-4" />
      </button>
      <OptimisticInput id={lineId} data={{ action: "remove" }} />
    </CartForm>
  );
}

function CartLineQuantityAdjust({
  line,
  layout,
}: {
  line: CartLine;
  layout: Layouts;
}) {
  const optimisticId = line?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);
  const [inputValue, setInputValue] = useState("");

  const optimisticQuantity = optimisticData?.quantity || line?.quantity;

  // Sync input value with optimisticQuantity changes
  useEffect(() => {
    if (optimisticQuantity !== undefined) {
      setInputValue(String(optimisticQuantity));
    }
  }, [optimisticQuantity]);

  if (!line || typeof line?.quantity === "undefined") {
    return null;
  }

  const { id: lineId, isOptimistic, merchandise } = line;

  // Get quantity rules from merchandise (B2B feature)
  const quantityRule = merchandise?.quantityRule;
  const increment = quantityRule?.increment || 1;
  const minimum = quantityRule?.minimum || 1;
  const maximum = quantityRule?.maximum || null;

  // Calculate previous and next quantities based on increment
  const prevQuantity = Number(
    Math.max(minimum, optimisticQuantity - increment).toFixed(0),
  );
  const nextQuantity = Number((optimisticQuantity + increment).toFixed(0));

  // Check if we've reached the maximum
  const isAtMaximum = maximum !== null && nextQuantity > maximum;

  function handleQuantityInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  function handleQuantityInputBlur() {
    let newQuantity = Number.parseInt(inputValue, 10) || optimisticQuantity;
    newQuantity = Math.max(minimum, newQuantity);
    if (maximum) {
      newQuantity = Math.min(maximum, newQuantity);
    }
    setInputValue(String(newQuantity));

    if (newQuantity !== optimisticQuantity) {
      const formData = new FormData();
      formData.append(
        CartForm.INPUT_NAME,
        JSON.stringify({
          action: CartForm.ACTIONS.LinesUpdate,
          inputs: { lines: [{ id: lineId, quantity: newQuantity }] },
        }),
      );
      fetch("/cart", { method: "POST", body: formData });
    }
  }

  function handleQuantityInputKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Enter") {
      handleQuantityInputBlur();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setInputValue(String(optimisticQuantity));
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <>
      <label htmlFor={`quantity-${lineId}`} className="sr-only">
        Quantity, {optimisticQuantity}
      </label>
      <div
        className={clsx(
          "flex h-[45px] shrink-0 items-center divide-x divide-(--color-line) rounded-(--btn-border-radius) border border-(--color-line) text-base",
          layout === "page" && "w-[180px]",
        )}
      >
        <UpdateCartButton lines={[{ id: lineId, quantity: prevQuantity }]}>
          <button
            type="submit"
            name="decrease-quantity"
            aria-label={`Decrease quantity by ${increment}`}
            className="flex h-full shrink-0 items-center justify-center px-4 transition disabled:cursor-not-allowed disabled:text-body-subtle"
            value={prevQuantity}
            disabled={optimisticQuantity <= minimum || isOptimistic}
            title={
              optimisticQuantity <= minimum
                ? `Minimum quantity is ${minimum}`
                : ""
            }
          >
            <MinusIcon className="size-4" aria-hidden="true" />
            <OptimisticInput
              id={optimisticId}
              data={{ quantity: prevQuantity }}
            />
          </button>
        </UpdateCartButton>

        <input
          type="number"
          value={inputValue}
          onChange={handleQuantityInputChange}
          onBlur={handleQuantityInputBlur}
          onKeyDown={handleQuantityInputKeyDown}
          className="h-full min-w-0 grow basis-16 bg-transparent px-2 text-center text-base text-body-subtle focus:outline-none"
          data-test="item-quantity"
          min={minimum}
          max={maximum || undefined}
          disabled={isOptimistic}
        />

        <UpdateCartButton lines={[{ id: lineId, quantity: nextQuantity }]}>
          <button
            type="submit"
            className="flex h-full shrink-0 items-center justify-center px-4 transition disabled:cursor-not-allowed disabled:text-body-subtle"
            name="increase-quantity"
            value={nextQuantity}
            aria-label={`Increase quantity by ${increment}`}
            disabled={isOptimistic || isAtMaximum}
            title={isAtMaximum ? `Maximum quantity is ${maximum}` : ""}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            <OptimisticInput
              id={optimisticId}
              data={{ quantity: nextQuantity }}
            />
          </button>
        </UpdateCartButton>
      </div>
    </>
  );
}

function UpdateCartButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      fetcherKey={lines[0]?.id}
      inputs={{
        lines,
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLinePrice({
  line,
  priceType = "regular",
  className,
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: "regular" | "compareAt";
  className?: string;
  [key: string]: any;
}) {
  let fetcher = useFetcher({
    key: line.id,
  });
  if (!(line?.cost?.amountPerQuantity && line?.cost?.totalAmount)) {
    return null;
  }

  if (fetcher.state !== "idle") {
    return (
      <CircleNotchIcon size={18} className={clsx("animate-spin", className)} />
    );
  }

  const moneyV2 =
    priceType === "regular"
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return (
    <Money
      withoutTrailingZeros
      {...passthroughProps}
      data={moneyV2}
      className={clsx("font-semibold", className)}
    />
  );
}

function CartEmpty({
  hidden = false,
  layout = "drawer",
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);
  return (
    <div
      ref={scrollRef}
      className={clsx(
        layout === "drawer" && [
          "h-full w-full content-start space-y-12 overflow-y-scroll px-5 pb-6 transition",
          y > 0 && "border-t",
        ],
        layout === "page" && [
          "w-full gap-4 pb-12 md:items-start md:gap-8 lg:gap-12",
        ],
      )}
      hidden={hidden}
    >
      <div className={clsx(layout === "page" && "text-center")}>
        <p className="mb-4">
          Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
          started!
        </p>
        <Link
          variant="outline"
          to={layout === "page" ? "/products" : ""}
          className={clsx(
            layout === "drawer" ? "w-full" : "min-w-48",
            "justify-center",
          )}
          onClick={onClose}
        >
          Start Shopping
        </Link>
      </div>
      <Section
        width={layout === "drawer" ? "full" : "fixed"}
        verticalPadding="medium"
      >
        <div className="grid gap-4">
          <CartBestSellers
            count={4}
            heading="Shop Best Sellers"
            layout={layout}
            sortKey="BEST_SELLING"
          />
        </div>
      </Section>
    </div>
  );
}
