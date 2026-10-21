import type { LoaderFunctionArgs } from "react-router";
import { CUSTOMER_LOCATIONS_QUERY } from "~/graphql/customer-locations-query.account";
import { MARKET_QUERY } from "~/graphql/queries";
import { customerIdFromGid, devCustomerIdOverride } from "./client.server";
import {
  CHECKOUT_REUSE_MS,
  fingerprint,
  incrementBreaches,
  mergeLines,
  normId,
  pricingKey,
} from "./headless";
import {
  fetchCartPricing,
  fetchCheckout,
  isHeadlessConfigured,
} from "./headless.server";
import type {
  CartLineForPricing,
  CartPricingState,
  CheckoutState,
  HeadlessRequest,
} from "./types";

/**
 * Pricing the cart through B2Bridge.
 *
 * Kept apart from `client.server.ts`, which prices the product page from the
 * older Price List API and is free to fall back to Shopify's price. This path
 * decides what the buyer is charged, so every outcome it cannot vouch for ends
 * in `unavailable` and stops checkout.
 */

type Context = LoaderFunctionArgs["context"];

/**
 * The signed-in buyer's bare Shopify customer id, or `null` when there is
 * nobody to price for.
 *
 * Mirrors what `($locale).products.$productHandle.tsx` does for the product
 * page; worth collapsing into one helper once both paths have settled.
 */
/**
 * Three answers, because "nobody to price for" and "could not find out who
 * this is" must not share one.
 *
 * `guest` is a settled fact: there is no signed-in buyer, so B2Bridge has
 * nothing to price and the ordinary storefront is correct. `unknown` is this
 * storefront failing to ask — a Customer Account query that threw, or one that
 * answered without an id. Returning `guest` for that put a signed-in wholesale
 * buyer through Shopify checkout at retail prices, which is the outcome this
 * integration exists to prevent.
 */
type BuyerLookup =
  | { kind: "buyer"; customerId: string }
  | { kind: "guest" }
  | { kind: "unknown" };

async function resolveBuyerId(context: Context): Promise<BuyerLookup> {
  const override = devCustomerIdOverride(context.env);
  if (override) {
    return { kind: "buyer", customerId: override };
  }
  // Asked for only when it is needed. The override answers without it, and a
  // session check is a round trip like any other.
  let loggedIn = false;
  try {
    loggedIn = await context.customerAccount.isLoggedIn();
  } catch (error) {
    // Even the session check can fail, and a failure here says nothing about
    // whether there is a buyer behind it.
    console.warn("[B2Bridge] session check failed:", (error as Error)?.message);
    return { kind: "unknown" };
  }
  if (!loggedIn) {
    return { kind: "guest" };
  }

  try {
    const result = await context.customerAccount.query(
      CUSTOMER_LOCATIONS_QUERY,
    );
    const customerId = customerIdFromGid(result.data?.customer?.id);
    // Signed in, asked, and still no id: an answer this storefront cannot act
    // on is not the same as there being nobody to act for.
    return customerId ? { kind: "buyer", customerId } : { kind: "unknown" };
  } catch (error) {
    console.warn(
      "[B2Bridge] customer lookup failed:",
      (error as Error)?.message,
    );
    return { kind: "unknown" };
  }
}

/**
 * The market the buyer is shopping in.
 *
 * Returns `null` when it cannot be resolved, and the caller then refuses to
 * price rather than sending the request without it. Leaving `market` out does
 * not fail — it tells B2Bridge to skip the market check, which would apply a
 * rule scoped to Canada to a buyer in Vietnam. Silently wrong prices are the
 * one outcome this integration exists to prevent.
 */
async function loadMarket(
  context: Context,
): Promise<{ id: string; countryCode: string } | null> {
  try {
    const result = await context.storefront.query(MARKET_QUERY, {
      cache: context.storefront.CacheLong(),
    });
    const id = result?.localization?.market?.id;
    const countryCode = result?.localization?.country?.isoCode;
    return id && countryCode ? { id, countryCode } : null;
  } catch (error) {
    console.warn("[B2Bridge] market lookup failed:", (error as Error)?.message);
    return null;
  }
}

type Prepared =
  | {
      kind: "ready";
      request: HeadlessRequest;
      /** Bare variant id → the cart line ids merged into it. */
      sources: Map<string, string[]>;
    }
  | { kind: "stop"; reason: "not-applicable" | "unavailable" };

/**
 * Everything both endpoints need before they can ask B2Bridge anything.
 *
 * Shared so pricing the cart and paying for it cannot drift apart: the same
 * buyer, the same market and the same merged lines go to both, which is what
 * makes the price in the cart the price on the invoice.
 */
async function prepare(context: Context): Promise<Prepared> {
  const { env } = context;
  if (!isHeadlessConfigured(env)) {
    return { kind: "stop", reason: "not-applicable" };
  }

  // Three independent lookups. Run in series they were three round trips the
  // buyer waited through before B2Bridge was even asked.
  const [buyer, cart, market] = await Promise.all([
    resolveBuyerId(context),
    context.cart.get(),
    loadMarket(context),
  ]);

  // Fail closed on `unknown`: the cart must not offer Shopify checkout to a
  // buyer this storefront merely failed to identify.
  if (buyer.kind === "unknown") {
    return { kind: "stop", reason: "unavailable" };
  }
  if (buyer.kind === "guest") {
    return { kind: "stop", reason: "not-applicable" };
  }
  const { customerId } = buyer;

  const cartLines: CartLineForPricing[] = (cart?.lines?.nodes ?? [])
    .map((node) => ({
      id: node.id,
      variantId: node.merchandise?.id ?? "",
      quantity: node.quantity,
    }))
    .filter((line) => line.variantId);

  if (cartLines.length === 0) {
    return { kind: "stop", reason: "not-applicable" };
  }

  if (!market) {
    return { kind: "stop", reason: "unavailable" };
  }

  const { lines, sources } = mergeLines(cartLines);
  // Merging drops quantities Shopify would not keep anyway. Being left with
  // nothing means there is no cart to price, which is not a failure — sending
  // it would earn an `INVALID_REQUEST` and tell the buyer that wholesale
  // pricing is down when their cart is simply empty.
  if (lines.length === 0) {
    return { kind: "stop", reason: "not-applicable" };
  }

  return {
    kind: "ready",
    sources,
    request: {
      domain: env.PUBLIC_STORE_DOMAIN,
      customerId,
      lines,
      market,
    },
  };
}

/** Prices whatever is in the buyer's cart right now. */
export async function loadCartPricing(
  context: Context,
): Promise<CartPricingState> {
  // Read, never acted on here: a loader that changed the cart would do it on
  // a prefetch too. The cart is settled by `api.b2b-settle`, which this only
  // tells the storefront to call.
  const mark = readCheckoutMark(context);
  const pendingDraft = Boolean(
    mark?.draftOrderId && Date.now() - mark.at < CHECKOUT_PENDING_MS,
  );

  const prepared = await prepare(context);
  if (prepared.kind === "stop") {
    return prepared.reason === "unavailable"
      ? { status: "unavailable", retryable: true, pendingDraft }
      : { status: "not-applicable", pendingDraft };
  }
  const { sources } = prepared;

  const result = await fetchCartPricing(context.env, prepared.request);

  if (result.kind === "failed") {
    const { action } = result.failure;
    return {
      status: "unavailable",
      retryable: action === "RETRY_BACKOFF" || action === "RETRY_LATER",
      pendingDraft,
    };
  }

  const lineVariants: Record<string, string> = {};
  for (const [variantId, lineIds] of sources) {
    for (const lineId of lineIds) {
      lineVariants[lineId] = variantId;
    }
  }

  const { data } = result;
  return {
    status: "priced",
    pendingDraft,
    currency: data.currency,
    subtotal: data.subtotal,
    canCheckout: data.canCheckout,
    errors: data.errors,
    lineVariants,
    lines: data.lines.map((line) => ({
      variantId: normId(line.variantId),
      productId: normId(line.productId),
      quantity: line.quantity,
      originalUnitPrice: line.originalUnitPrice,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      hasRule: line.hasRule,
      minimum: line.minimum,
      maximum: line.maximum,
      increment: line.increment,
    })),
  };
}

const CHECKOUT_SESSION_KEY = "b2bridgeCheckout";

interface CheckoutMark {
  /** Fingerprint of the cart this invoice was made for. */
  mark: string;
  /** The draft order to ask Shopify about when the buyer comes back. */
  draftOrderId: string;
  invoiceUrl: string;
  subtotal: number;
  currency: string;
  at: number;
}

export function readCheckoutMark(context: Context): CheckoutMark | null {
  const stored = context.session.get(CHECKOUT_SESSION_KEY) as
    | CheckoutMark
    | undefined;
  return stored?.mark && stored.invoiceUrl ? stored : null;
}

export function clearCheckoutMark(context: Context): void {
  context.session.unset(CHECKOUT_SESSION_KEY);
}

/**
 * How long a paid order is still worth looking for.
 *
 * The buyer has to come back to the storefront for the cart to be settled, so
 * this is the window in which that still happens. Beyond it the record is of
 * no use: the cart they would have been credited against has long since
 * changed.
 */
export const CHECKOUT_PENDING_MS = 24 * 60 * 60 * 1000;

/**
 * Prices the cart again and creates the draft order to pay for it.
 *
 * Only ever from a buyer's click. Every call creates a draft order in the
 * merchant's admin and B2Bridge offers no way to delete one, so a prefetch, a
 * retry or a double submit each leave a real order behind.
 *
 * B2Bridge prices from scratch rather than trusting the figure the cart was
 * showing, so the subtotal that comes back is the one that will be charged —
 * and may differ from the one the buyer was looking at if the merchant edited
 * a price list in between. It is returned for the cart to compare.
 */
export async function createCheckout(context: Context): Promise<CheckoutState> {
  const prepared = await prepare(context);
  if (prepared.kind === "stop") {
    return prepared.reason === "unavailable"
      ? { status: "unavailable", retryable: true }
      : { status: "not-applicable" };
  }

  // Sequential duplicates — a second tab, a back button, a click after the
  // first one has already landed — get the invoice that was already made for
  // this exact cart rather than a second draft order the merchant has to go
  // and tidy up. Two genuinely simultaneous clicks still race past this,
  // because both read the session before either writes it; that case is the
  // disabled button's to catch.
  const mark = fingerprint(pricingKey(prepared.request));
  const prior = readCheckoutMark(context);
  if (
    prior &&
    prior.mark === mark &&
    Date.now() - prior.at < CHECKOUT_REUSE_MS
  ) {
    return {
      status: "ok",
      invoiceUrl: prior.invoiceUrl,
      subtotal: prior.subtotal,
      currency: prior.currency,
    };
  }

  // Priced once before the draft order is asked for, only to hold the cart to
  // the increments its rule sets. B2Bridge reports an increment on every line
  // and then accepts any quantity regardless of it, so checking out a cart of
  // 12 where the rule says steps of 5 would have B2Bridge create a draft order
  // the merchant's own rule forbids — and there is no endpoint to delete a
  // draft order once it exists. One extra request, on a click that happens
  // once per order, is the cheap half of that trade.
  //
  // `canCheckout` is checked here too. `fetchCheckout` reports the same limits
  // and nothing is created when it refuses, but finding out before asking
  // keeps the two paths from disagreeing about which rules stop a checkout.
  const priced = await fetchCartPricing(context.env, prepared.request);
  if (priced.kind === "failed") {
    const { action } = priced.failure;
    if (action === "SHOW_ERRORS") {
      return { status: "limits" };
    }
    return {
      status: "unavailable",
      retryable: action === "RETRY_BACKOFF" || action === "RETRY_LATER",
    };
  }
  if (!priced.data.canCheckout) {
    return { status: "limits" };
  }
  if (incrementBreaches(priced.data.lines).length > 0) {
    return { status: "limits" };
  }

  const result = await fetchCheckout(context.env, prepared.request);
  if (result.kind === "failed") {
    const { action } = result.failure;
    // The cart broke an order rule. Nothing was created, and the cart already
    // knows how to say which rule — so this only has to send them back to it.
    if (action === "SHOW_ERRORS") {
      return { status: "limits" };
    }
    return {
      status: "unavailable",
      retryable: action === "RETRY_BACKOFF" || action === "RETRY_LATER",
    };
  }

  context.session.set(CHECKOUT_SESSION_KEY, {
    mark,
    draftOrderId: result.data.draftOrderId,
    invoiceUrl: result.data.invoiceUrl,
    subtotal: result.data.subtotal,
    currency: result.data.currency,
    at: Date.now(),
  } satisfies CheckoutMark);

  return {
    status: "ok",
    invoiceUrl: result.data.invoiceUrl,
    subtotal: result.data.subtotal,
    currency: result.data.currency,
  };
}
