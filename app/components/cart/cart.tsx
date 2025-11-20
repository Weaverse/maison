import { CircleNotchIcon, TrashIcon } from "@phosphor-icons/react";
import {
  CartForm,
  Money,
  type OptimisticCart,
  OptimisticInput,
  useOptimisticCart,
  useOptimisticData,
} from "@shopify/hydrogen";
import type {
  CartLineUpdateInput,
  Cart as CartType,
} from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { useRef } from "react";
import { useFetcher } from "react-router";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { RevealUnderline } from "~/components/reveal-underline";
import { ScrollArea } from "~/components/scroll-area";
import { Section } from "~/components/section";
import { calculateAspectRatio } from "~/utils/image";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CartBestSellers } from "./cart-best-sellers";

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

  if (cartHasItems) {
    return <CartDetails cart={cart} layout={layout} />;
  }
  return <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />;
}

function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: OptimisticCart<CartApiQueryFragment>;
}) {
  return (
    <div
      className={clsx(
        layout === "drawer" &&
          "grid grow grid-cols-1 grid-rows-[1fr_auto] px-4",
        layout === "page" && [
          "mx-auto w-full max-w-(--page-width) pb-12",
          "grid md:grid-cols-[1fr_auto] md:items-start",
          "gap-6",
        ],
      )}
    >
      <CartLines lines={cart?.lines?.nodes} layout={layout} />
      <div className="space-y-4">
        <CartSummary cost={cart.cost} layout={layout}>
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} layout={layout} />
        </CartSummary>
        <CartDiscounts discountCodes={cart.discountCodes} cost={cart.cost} />
      </div>
    </div>
  );
}

/**
 * Temporary discount UI
 * @param discountCodes the current discount codes applied to the cart
 * @todo rework when a design is ready
 */
function CartDiscounts({
  discountCodes,
  cost,
}: {
  discountCodes: CartType["discountCodes"];
  cost: CartApiQueryFragment["cost"];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({ code }) => code) || [];

  // Calculate the discount amount
  const discountAmount =
    cost?.subtotalAmount && cost?.totalAmount
      ? Number(cost.subtotalAmount.amount) - Number(cost.totalAmount.amount)
      : 0;

  return (
    <div className="grid gap-3 bg-white p-6 rounded-sm">
      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex items-center gap-3">
          <input
            className="grow rounded-none border border-line px-3 py-3 text-sm leading-tight!"
            type="text"
            name="discountCode"
            placeholder="Promo code"
          />
          <Button
            type="submit"
            variant="outline"
            className="px-6 leading-tight!"
          >
            Apply
          </Button>
        </div>
      </UpdateDiscountForm>

      {/* Have existing discount, display it with a remove option */}
      {codes && codes.length > 0 && discountAmount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {codes.map((code) => (
            <UpdateDiscountForm key={code}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full border border-line-subtle bg-background px-3 py-1.5 text-sm transition-colors hover:bg-background-subtle"
              >
                <span className="text-body-subtle">🏷️</span>
                <span className="font-medium">{code}</span>
                <span className="text-body-subtle">
                  (-
                  <Money
                    data={{
                      amount: String(discountAmount),
                      currencyCode: cost.subtotalAmount?.currencyCode || "USD",
                    }}
                  />
                  )
                </span>
                <span className="ml-0.5 text-body-subtle hover:text-body">
                  ✕
                </span>
              </button>
            </UpdateDiscountForm>
          ))}
        </div>
      )}
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
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
        layout === "page" && "grow bg-white p-6 rounded-sm",
        layout === "drawer" && "transition -mx-4 pb-4",
      ])}
    >
      <ScrollArea
        className={clsx(layout === "drawer" && "max-h-[calc(100vh-312px)]")}
        size="sm"
      >
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
    <div className="flex flex-col gap-3">
      <a href={checkoutUrl} target="_self">
        <Button className="w-full bg-[#8B8270] hover:bg-[#7A7263] text-white border-0">
          Checkout
        </Button>
      </a>
      {/* @todo: <CartShopPayButton cart={cart} /> */}
      {layout === "drawer" && (
        <Link variant="underline" to="/cart" className="mx-auto w-fit">
          View cart
        </Link>
      )}
    </div>
  );
}

function CartSummary({
  cost,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartApiQueryFragment["cost"];
  layout: Layouts;
}) {
  return (
    <div
      className={clsx(
        layout === "drawer" && "grid gap-4 border-line-subtle border-t pt-4",
        layout === "page" &&
          "sticky top-(--height-nav) grid h-fit w-full gap-6 bg-background-subtle/50 p-6 md:min-w-[380px] md:max-w-[420px] bg-white rounded-sm",
      )}
    >
      <h2
        className={clsx(
          layout === "page" ? "font-semibold text-base" : "sr-only",
        )}
      >
        Order Summary
      </h2>
      <div className="grid gap-6 border-t border-line-subtle pt-6">
        <dl className="grid gap-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-body">Subtotal</dt>
            <dd className="font-medium">
              {cost?.subtotalAmount?.amount ? (
                <Money data={cost?.subtotalAmount} />
              ) : (
                "-"
              )}
            </dd>
          </div>
          {cost?.totalAmount &&
            cost?.subtotalAmount &&
            cost.totalAmount.amount < cost.subtotalAmount.amount && (
              <div className="flex items-center justify-between">
                <dt className="text-body">Discount</dt>
                <dd className="font-medium text-red-600">
                  -
                  <Money
                    data={{
                      amount: String(
                        Number(cost.subtotalAmount.amount) -
                          Number(cost.totalAmount.amount),
                      ),
                      currencyCode: cost.subtotalAmount.currencyCode,
                    }}
                  />
                </dd>
              </div>
            )}
        </dl>
        <p className="text-body-subtle text-xs">
          Shipping & taxes calculated at checkout
        </p>
        <dl className="border-line-subtle border-t pt-6">
          <div className="flex items-center justify-between font-semibold text-base">
            <dt>Total</dt>
            <dd>
              {cost?.totalAmount?.amount ? (
                <Money data={cost?.totalAmount} />
              ) : (
                "-"
              )}
            </dd>
          </div>
        </dl>
      </div>
      {children}
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
      className={clsx("flex gap-4", layout === "page" && "not-last:pb-6")}
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
              "h-auto object-cover aspect-square rounded-sm",
              layout === "page" ? "w-32 md:w-36" : "w-24",
            )}
            alt={title}
            aspectRatio={calculateAspectRatio(image, "adapt")}
          />
        )}
      </div>
      <div
        className={clsx(
          "flex grow flex-col gap-3",
          layout === "page" && "h-full justify-between py-6",
        )}
      >
        <div className="flex justify-between gap-6">
          <div className="space-y-1">
            <div className="font-semibold">
              {product?.handle ? (
                <Link
                  to={url}
                  onClick={() => toggleCartDrawer(false)}
                  className="inline-block hover:opacity-70 transition-opacity"
                >
                  {product?.title || ""}
                </Link>
              ) : (
                <p>{product?.title || ""}</p>
              )}
            </div>
            {formattedVariant && (
              <div className="text-body-subtle text-sm">{formattedVariant}</div>
            )}
          </div>
          {layout === "page" && (
            <ItemRemoveButton lineId={id} className="-mt-1" />
          )}
          {layout === "drawer" && (
            <ItemRemoveButton lineId={id} className="-mt-1.5 -mr-2" />
          )}
        </div>
        <div
          className={clsx(
            "flex items-center",
            layout === "page" && "justify-between",
            layout === "drawer" && "justify-between gap-2",
          )}
        >
          <CartLineQuantityAdjust line={line} />
          <CartLinePrice line={line} as="span" />
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

function CartLineQuantityAdjust({ line }: { line: CartLine }) {
  const optimisticId = line?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);

  if (!line || typeof line?.quantity === "undefined") {
    return null;
  }

  const optimisticQuantity = optimisticData?.quantity || line.quantity;

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

  return (
    <>
      <label htmlFor={`quantity-${lineId}`} className="sr-only">
        Quantity, {optimisticQuantity}
      </label>
      <div className="flex items-center border border-line-subtle text-sm">
        <UpdateCartButton lines={[{ id: lineId, quantity: prevQuantity }]}>
          <button
            type="submit"
            name="decrease-quantity"
            aria-label={`Decrease quantity by ${increment}`}
            className="flex h-10 w-10 items-center justify-center transition disabled:cursor-not-allowed disabled:text-body-subtle"
            value={prevQuantity}
            disabled={optimisticQuantity <= minimum || isOptimistic}
            title={
              optimisticQuantity <= minimum
                ? `Minimum quantity is ${minimum}`
                : ""
            }
          >
            <span>&#8722;</span>
            <OptimisticInput
              id={optimisticId}
              data={{ quantity: prevQuantity }}
            />
          </button>
        </UpdateCartButton>

        <div
          className="min-w-[3rem] px-3 text-center"
          data-test="item-quantity"
        >
          {optimisticQuantity}
        </div>

        <UpdateCartButton lines={[{ id: lineId, quantity: nextQuantity }]}>
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center transition disabled:cursor-not-allowed disabled:text-body-subtle"
            name="increase-quantity"
            value={nextQuantity}
            aria-label={`Increase quantity by ${increment}`}
            disabled={isOptimistic || isAtMaximum}
            title={isAtMaximum ? `Maximum quantity is ${maximum}` : ""}
          >
            <span>&#43;</span>
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
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: "regular" | "compareAt";
  [key: string]: any;
}) {
  let fetcher = useFetcher({
    key: line.id,
  });
  if (!(line?.cost?.amountPerQuantity && line?.cost?.totalAmount)) {
    return null;
  }

  if (fetcher.state !== "idle") {
    return <CircleNotchIcon size={18} className="animate-spin" />;
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
      className="ml-auto font-semibold"
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
          "h-screen-dynamic w-[400px] content-start space-y-12 overflow-y-scroll px-5 pb-5 transition",
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
