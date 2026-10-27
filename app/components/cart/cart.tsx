import {
  CircleNotchIcon,
  MinusIcon,
  PlusIcon,
  TagIcon,
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
import type {
  CartLineUpdateInput,
  CurrencyCode,
} from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings, useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import {
  B2BPricingProvider,
  useB2BLinePrice,
  useB2BPricing,
  useCheckoutGate,
  useLimitMessages,
  useProductRecalculating,
} from "~/components/cart/b2b-cart-pricing";
import { SubscriptionIcon } from "~/components/icons";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { ScrollArea } from "~/components/scroll-area";
import { Section } from "~/components/section";
import { Skeleton } from "~/components/skeleton";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { allowedQuantity, strictestRule } from "~/utils/b2bridge/headless";
import type { CheckoutState } from "~/utils/b2bridge/types";
import { calculateAspectRatio } from "~/utils/image";
import { toggleCartDrawer } from "../layout/cart-drawer";
import { CartBestSellers } from "./cart-best-sellers";
import { CartDiscount } from "./cart-discount";
import { CartSummary } from "./cart-summary";
import {
  beginCheckout,
  type CheckoutResultTracker,
  checkoutResultForCart,
} from "./checkout-result";

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
    // `originalCart`, not the optimistic one: pricing may only be asked for a
    // cart the server has already accepted.
    <B2BPricingProvider cart={originalCart}>
      {cartHasItems && <CartDetails cart={cart} layout={layout} />}
      <CartEmpty
        hidden={cartHasItems || linesCount}
        onClose={onClose}
        layout={layout}
      />
    </B2BPricingProvider>
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
  const { t } = useTranslation();
  const gate = useCheckoutGate();
  const limitMessages = useLimitMessages();
  const { state, cartKey } = useB2BPricing();
  const checkoutPath = usePrefixPathWithLocale("/api/b2b-checkout");
  // The keyed fetcher shares its pending state across cart views, but its data
  // can outlive a cart or a component mount. Capture the key at submit time,
  // not when the reply arrives: the buyer may edit the cart in between. A new
  // mount has no recorded submission, so it cannot adopt an old response.
  const fetcher = useFetcher<CheckoutState>({ key: "b2b-checkout" });
  const checkoutTracker = useRef<CheckoutResultTracker>({
    cartKey,
    submittedKey: null,
    previousData: undefined,
    invalidated: false,
  });
  const scoped = checkoutResultForCart(
    checkoutTracker.current,
    cartKey,
    fetcher.data,
  );
  checkoutTracker.current = scoped.tracker;
  const result = scoped.result;
  const working = fetcher.state !== "idle";
  const revalidator = useRevalidator();

  function handleCheckoutSubmit() {
    // Ignore the fetcher's earlier response while a new request is pending.
    checkoutTracker.current = beginCheckout(cartKey, fetcher.data);
  }

  // B2Bridge owns this cart's prices, so it must also own the order. Shopify's
  // own checkout URL would charge the retail price it computed.
  const payThroughB2Bridge = state?.status === "priced";
  const shownSubtotal = state?.status === "priced" ? state.subtotal : null;
  const repriced =
    result?.status === "ok" &&
    shownSubtotal !== null &&
    result.subtotal !== shownSubtotal;

  useEffect(() => {
    // Straight through when the figure the buyer agreed to is the one that
    // was charged. When it is not, they are told before they are sent.
    if (result?.status === "ok" && !repriced) {
      window.location.href = result.invoiceUrl;
    }
    // The cart broke a rule this page did not know about — it was changed
    // somewhere else, in another tab or on another device. Reloading it is
    // what makes the cart able to say which rule, since the figures on screen
    // were worked out for a cart that no longer exists.
    if (result?.status === "limits") {
      revalidator.revalidate();
    }
  }, [result, repriced, revalidator.revalidate]);

  if (!checkoutUrl) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {layout === "drawer" && (
        // Both buttons go through the shared variants rather than restating
        // the colours and padding by hand. That is what keeps them the same
        // height — the hand-rolled checkout dropped its border and so sat 2px
        // shorter — and it is what gives them a hover state at all.
        <Link
          to="/cart"
          variant="outline"
          onClick={() => toggleCartDrawer(false)}
          className="w-full font-normal"
        >
          {t("cart.viewCart")}
        </Link>
      )}
      {gate.reason === "pending" ? (
        // A spinner rather than a message: nothing has gone wrong, the cart
        // just does not know yet what this buyer pays. The button is the right
        // shape and size already, so the wait does not move the layout.
        <Button
          disabled
          loading
          variant="primary"
          className="w-full font-normal"
        >
          {t("cart.checkout")}
        </Button>
      ) : gate.blocked ? (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-(--color-text-subtle)">
            {gate.reason === "unavailable" ? (
              // `retryable: false` here means asking again changes nothing —
              // the cart holds something B2Bridge's request cannot express,
              // and only the buyer can take it out. Telling them to wait a
              // moment would leave them waiting for good.
              <p>
                {t(
                  state?.status === "unavailable" && !state.retryable
                    ? "cart.b2bCartUnsupported"
                    : "cart.b2bUnavailable",
                )}
              </p>
            ) : (
              <>
                <p>{t("cart.b2bFixQuantities")}</p>
                <ul className="list-disc pl-5">
                  {limitMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {/* Never a link to Shopify checkout while blocked: that page would
              charge Shopify's price, which is the number this integration
              exists to not charge. */}
          <Button disabled variant="primary" className="w-full font-normal">
            {t("cart.checkout")}
          </Button>
        </div>
      ) : payThroughB2Bridge ? (
        <div className="flex flex-col gap-2">
          {result?.status === "unavailable" && (
            // `retryable: false` is the server saying it does not know whether
            // B2Bridge created the draft order — a lost response, a timeout.
            // Telling the buyer to try again is the one piece of advice that
            // must not be given there: a second attempt past the 60s reuse
            // window creates a second invoice, and no endpoint deletes one.
            <p className="text-sm text-(--color-text-subtle)">
              {t(
                result.retryable
                  ? "cart.b2bCheckoutFailed"
                  : "cart.b2bCheckoutUnconfirmed",
              )}
            </p>
          )}
          {result?.status === "limits" && (
            <p className="text-sm text-(--color-text-subtle)">
              {t("cart.b2bCartChanged")}
            </p>
          )}
          {repriced && result?.status === "ok" && (
            <p className="text-sm text-(--color-text-subtle)">
              {t("cart.b2bPriceChanged", {
                total: new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: result.currency,
                }).format(result.subtotal),
              })}
            </p>
          )}
          {repriced && result?.status === "ok" ? (
            // The draft order already exists and already carries this price;
            // there is nothing to create again, only a buyer to inform.
            <a href={result.invoiceUrl} target="_self" className="w-full">
              <Button variant="primary" className="w-full font-normal">
                {t("cart.b2bContinueToPayment")}
              </Button>
            </a>
          ) : (
            <fetcher.Form
              method="post"
              action={checkoutPath}
              onSubmit={handleCheckoutSubmit}
            >
              <Button
                type="submit"
                // Each submission creates a draft order the merchant cannot
                // delete, so the button closes the moment it is used and stays
                // closed through the navigation that follows. The session
                // guard covers the cases this cannot — a second tab, a back
                // button — but two genuinely simultaneous clicks are its job.
                //
                // It stays closed on an unconfirmed result too. The message
                // above that one says an invoice may already exist and asks
                // the buyer to check their orders; leaving the button live
                // underneath invited exactly the second draft order the
                // message is there to prevent.
                disabled={
                  working ||
                  result?.status === "ok" ||
                  (result?.status === "unavailable" && !result.retryable)
                }
                loading={working}
                variant="primary"
                className="w-full font-normal"
              >
                {t("cart.checkout")}
              </Button>
            </fetcher.Form>
          )}
        </div>
      ) : (
        <a href={checkoutUrl} target="_self" className="w-full">
          <Button variant="primary" className="w-full font-normal">
            {t("cart.checkout")}
          </Button>
        </a>
      )}
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
        {/* The saving and the price on one line. `-mt-3` pulls the row up
            against the variant: the column's own 16px gap is meant for the
            blocks below, not for this. One price node for both layouts, so it
            is never in the document twice. */}
        <div className="-mt-3 flex items-start justify-between gap-4">
          <CartLineSaving line={line} />
          <CartLinePrice
            line={line}
            as="span"
            className="ml-auto shrink-0 text-right"
          />
        </div>
        <div
          className={clsx(
            layout === "drawer" &&
              "flex flex-col-reverse items-start gap-2 md:flex-row md:items-center",
            layout === "page" &&
              "flex flex-col items-start gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2",
          )}
        >
          <div
            className={clsx(
              layout === "drawer" && "flex min-w-0 items-center md:grow",
              layout === "page" &&
                "flex min-w-0 flex-col items-start gap-4 md:flex-row md:items-center md:gap-3",
            )}
          >
            <CartLineQuantityAdjust line={line} layout={layout} />
            {layout === "page" &&
              line.sellingPlanAllocation?.sellingPlan?.name && (
                <div className="inline-flex items-center gap-1 rounded-lg bg-[#EBE8E5] px-2 py-1 text-xs text-body-subtle">
                  <SubscriptionIcon className="h-3 w-3" />
                  <span>{line.sellingPlanAllocation.sellingPlan.name}</span>
                </div>
              )}
          </div>
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
  const { t } = useTranslation();
  const cartAction = usePrefixPathWithLocale("/cart");
  return (
    <CartForm
      route={cartAction}
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
        <span className="sr-only">{t("cart.removeItem")}</span>
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
  const cartAction = usePrefixPathWithLocale("/cart");
  const optimisticId = line?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);
  // Keyed to the line, like `UpdateCartButton`'s own form, so a typed quantity
  // and a tapped one are the same kind of event to everything downstream.
  const quantityFetcher = useFetcher({ key: optimisticId });
  // Called here rather than after the guard below, because a hook cannot sit
  // behind an early return.
  const b2bLine = useB2BLinePrice(optimisticId);
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

  // Two rules can bind this line at once, so the stepper obeys both. Reading
  // only `merchandise.quantityRule` is what left the cart stepping in ones
  // while the product page, which reads B2Bridge, stepped correctly; reading
  // only B2Bridge would drop a limit set in Shopify admin, which Shopify then
  // enforces at a checkout this cart had called fine.
  const { increment, minimum, maximum } = strictestRule(
    merchandise?.quantityRule,
    b2bLine,
  );

  // Stepping lands on quantities the rule actually allows, rather than adding
  // and subtracting the increment from wherever the line happens to sit. A
  // line of 12 under a rule of 5 is already off the grid — it can arrive that
  // way from a quantity typed before the rule changed — and `12 - 5` would
  // only move it to another quantity that cannot be checked out.
  const prevQuantity = allowedQuantity(
    Math.max(1, optimisticQuantity - 1),
    increment,
    minimum,
  );
  const stepDown = allowedQuantity(optimisticQuantity, increment, minimum);
  const nextQuantity =
    stepDown > optimisticQuantity ? stepDown : stepDown + increment;

  // Check if we've reached the maximum
  const isAtMaximum = maximum !== null && nextQuantity > maximum;

  function handleQuantityInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  function handleQuantityInputBlur() {
    let newQuantity = Number.parseInt(inputValue, 10) || optimisticQuantity;
    // Clamped before it is snapped, not after: snapping a number that was
    // already pulled down to the maximum can push it back over.
    if (maximum) {
      newQuantity = Math.min(maximum, newQuantity);
    }
    // B2Bridge reports the increment and then accepts any quantity against it,
    // so a typed 12 under a rule of 5 would price, show and check out as 12.
    // Snapping here is what makes the typed input obey the same rule the
    // stepper does.
    newQuantity = allowedQuantity(newQuantity, increment, minimum);
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
      // The same two fields `OptimisticInput` puts in the stepper's form, so
      // the number on screen moves the moment it is typed rather than waiting
      // for Shopify.
      formData.append("optimistic-identifier", lineId);
      formData.append(
        "optimistic-data",
        JSON.stringify({ quantity: newQuantity }),
      );
      // Through a fetcher, not a bare `fetch`. A bare one does reach Shopify,
      // but React Router never learns of it: no revalidation, so the loaders
      // keep serving the old cart, and no optimistic update, so the stepper
      // keeps showing the old number. The quantity only appeared to apply
      // after the drawer was closed and opened again.
      quantityFetcher.submit(formData, { method: "POST", action: cartAction });
    }
  }

  function handleQuantityInputKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Enter") {
      // Blurring fires `handleQuantityInputBlur` on its own. Calling it here
      // as well submitted the same quantity twice — `optimisticQuantity` has
      // not updated by the time the second call reads it, so the guard against
      // a no-op change does not catch it. Two cart mutations then follow one
      // keystroke, and each one asks B2Bridge to price the cart again.
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
          // Stretch, not centre: `divide-x` draws its rule on each child's own
          // edge, so a child shorter than the row leaves a short rule. The
          // minus sits inside a <form> with no height of its own, which is why
          // its divider stopped halfway while the input's ran the full height.
          "flex h-[45px] w-[180px] max-w-full items-stretch divide-x divide-(--color-line) rounded-(--btn-border-radius) border border-(--color-line) text-base",
          layout === "page" && "shrink-0",
          layout === "drawer" && "min-w-0",
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
          // The label beside it is `sr-only` and points here by id. Without
          // one, a screen reader announces an unlabelled number field.
          id={`quantity-${lineId}`}
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
  const cartAction = usePrefixPathWithLocale("/cart");
  return (
    <CartForm
      route={cartAction}
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

/**
 * What this line's volume tier took off, named where the buyer can see it.
 *
 * The price alone shows a smaller number than the list price without saying
 * why. Naming the saving beside its amount turns "that looks cheaper" into
 * "my trade pricing applied", which is the whole point of showing the buyer a
 * wholesale price in the first place.
 */
function CartLineSaving({ line }: { line: CartLine }) {
  const { t } = useTranslation();
  const { saleBadgeColor } = useThemeSettings();
  const b2bPrice = useB2BLinePrice(line.id);
  const { state } = useB2BPricing();
  // This line's own product, so moving one product does not set every line in
  // the cart spinning — but every line of that product does.
  const stale = useProductRecalculating(line.merchandise?.product?.id ?? null);

  // The amount taken off is exactly what a quantity change moves, so it holds
  // the spinner for this line rather than showing a figure for the previous
  // quantity as though it were settled.
  if (
    !b2bPrice ||
    state?.status !== "priced" ||
    b2bPrice.unitPrice >= b2bPrice.originalUnitPrice
  ) {
    return null;
  }

  // Only once a saving is already on screen. Showing the spinner on a line
  // that has none would add a row that was not there a moment ago and take it
  // away again, which moves everything below it twice per quantity change.
  if (stale) {
    return (
      <div className="flex items-center gap-1 pt-1 text-sm">
        {/* 112px, not the 160px this once was: the content column of a drawer
            line is about 224px wide, and the price placeholder takes the right
            64px of it. At the old width the two bars met in the middle. */}
        <Skeleton
          as="span"
          className="h-4 w-28 rounded"
          aria-label="Updating discount"
        />
      </div>
    );
  }

  const saved =
    (b2bPrice.originalUnitPrice - b2bPrice.unitPrice) * line.quantity;

  return (
    <div
      className="flex items-center gap-1 text-sm"
      style={{ color: saleBadgeColor }}
    >
      <TagIcon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        &minus;
        <Money
          as="span"
          withoutTrailingZeros
          data={{
            amount: String(saved),
            currencyCode: state.currency as CurrencyCode,
          }}
        />
        {" \u00b7 "}
        {t("cart.b2bTradeDiscount")}
      </span>
    </div>
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
  const b2bPrice = useB2BLinePrice(line.id);
  const { state: b2bState } = useB2BPricing();
  const { saleBadgeColor } = useThemeSettings();
  const recalculating = useProductRecalculating(
    line.merchandise?.product?.id ?? null,
  );
  const pricedByB2Bridge = Boolean(b2bPrice) && b2bState?.status === "priced";

  if (!(line?.cost?.amountPerQuantity && line?.cost?.totalAmount)) {
    return null;
  }

  // The theme's own spinner follows this line's fetcher, so it covers only the
  // line the buyer touched and stops as soon as Shopify answers. Under B2B
  // pricing that is the wrong shape twice over: the wait continues while
  // B2Bridge reprices, and it reprices every variant of the product, not this
  // line alone. One signal drives the whole line instead — otherwise this one
  // fires first and the saving's placeholder follows it, which reads as two
  // separate things loading.
  if (!pricedByB2Bridge && fetcher.state !== "idle") {
    return (
      <CircleNotchIcon
        size={18}
        // The line colour, so the spinner reads as the same quiet furniture as
        // the rules and field borders around it rather than as body text.
        className={clsx("animate-spin text-line", className)}
      />
    );
  }

  // Showing Shopify's price under a "pricing unavailable" notice would put the
  // exact number this integration exists not to charge in front of the buyer,
  // next to a sentence saying it is not available. Show nothing instead.
  if (b2bState?.status === "unavailable") {
    return <span className={className}>&mdash;</span>;
  }

  // One priced line can cover several cart lines of the same variant, so the
  // unit price is shared while the total stays this line's own.
  if (pricedByB2Bridge) {
    const unit =
      priceType === "regular" ? b2bPrice.unitPrice : b2bPrice.originalUnitPrice;
    if (priceType === "compareAt" && unit <= b2bPrice.unitPrice) {
      return null;
    }
    // B2Bridge sends the shop currency as a plain string; Shopify's generated
    // union is the stricter spelling of the same thing.
    const currencyCode = b2bState.currency as CurrencyCode;
    const money = (amount: number) => ({
      amount: String(amount),
      currencyCode,
    });
    // What this line costs without the buyer's tiers, struck through beside
    // the price they pay. Only once a tier has taken effect.
    const saved =
      priceType === "regular" &&
      b2bPrice.unitPrice < b2bPrice.originalUnitPrice;

    const figures = (
      <>
        <Money
          withoutTrailingZeros
          {...passthroughProps}
          data={money(unit * line.quantity)}
          className="font-semibold"
        />
        {saved && (
          <span
            className="font-normal text-sm line-through"
            style={{ color: saleBadgeColor }}
          >
            <Money
              as="span"
              withoutTrailingZeros
              data={money(b2bPrice.originalUnitPrice * line.quantity)}
            />
          </span>
        )}
      </>
    );

    // Laid over the figures rather than swapped in, so the line keeps its
    // height and nothing below it moves while the price is worked out. The
    // placeholder is one fixed size rather than the shape of what it covers:
    // sized to the figures it was a different bar on every line — wider for a
    // larger number, twice as tall where a compare-at price sits above. It is
    // positioned, so it never widens the cell: the row this sits in cannot
    // shrink (the saving beside it is a fixed width and this cell is
    // `shrink-0`), and a cell held open to the placeholder's width pushed the
    // whole row past the edge of the drawer. `top-1` matches the saving's own
    // `pt-1`, so on a row that aligns to the top the two bars line up.
    if (recalculating) {
      return (
        <span
          className={clsx("relative inline-flex flex-col items-end", className)}
        >
          <span
            className="invisible flex flex-col items-end"
            aria-hidden="true"
          >
            {figures}
          </span>
          <Skeleton
            as="span"
            className="absolute top-1 right-0 h-4 w-16 rounded"
            aria-label="Updating price"
          />
        </span>
      );
    }

    return (
      <span className={clsx("inline-flex flex-col items-end", className)}>
        {figures}
      </span>
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
  const { t } = useTranslation();
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
        <p className="mb-4">{t("cart.emptyMessage")}</p>
        <Link
          variant="outline"
          to={layout === "page" ? "/products" : ""}
          className={clsx(
            layout === "drawer" ? "w-full" : "min-w-48",
            "justify-center",
          )}
          onClick={onClose}
        >
          {t("cart.startShopping")}
        </Link>
      </div>
      <Section
        width={layout === "drawer" ? "full" : "fixed"}
        verticalPadding="medium"
      >
        <div className="grid gap-4">
          <CartBestSellers
            count={4}
            heading={t("cart.shopBestSellers")}
            layout={layout}
            sortKey="BEST_SELLING"
          />
        </div>
      </Section>
    </div>
  );
}
