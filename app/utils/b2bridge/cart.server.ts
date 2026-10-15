import type { LoaderFunctionArgs } from "react-router";
import { CUSTOMER_LOCATIONS_QUERY } from "~/graphql/customer-locations-query.account";
import { MARKET_QUERY } from "~/graphql/queries";
import { customerIdFromGid, devCustomerIdOverride } from "./client.server";
import { mergeLines, normId } from "./headless";
import { fetchCartPricing, isHeadlessConfigured } from "./headless.server";
import type { CartLineForPricing, CartPricingState } from "./types";

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
async function resolveBuyerId(context: Context): Promise<string | null> {
  const override = devCustomerIdOverride(context.env);
  if (override) {
    return override;
  }
  // Asked for only when it is needed. The override answers without it, and a
  // session check is a round trip like any other.
  if (!(await context.customerAccount.isLoggedIn())) {
    return null;
  }
  try {
    const result = await context.customerAccount.query(
      CUSTOMER_LOCATIONS_QUERY,
    );
    return customerIdFromGid(result.data?.customer?.id);
  } catch (error) {
    console.warn(
      "[B2Bridge] customer lookup failed:",
      (error as Error)?.message,
    );
    return null;
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

/** Prices whatever is in the buyer's cart right now. */
export async function loadCartPricing(
  context: Context,
): Promise<CartPricingState> {
  const { env } = context;
  if (!isHeadlessConfigured(env)) {
    return { status: "not-applicable" };
  }

  // Three independent lookups. Run in series they were three round trips the
  // buyer waited through before B2Bridge was even asked.
  const [customerId, cart, market] = await Promise.all([
    resolveBuyerId(context),
    context.cart.get(),
    loadMarket(context),
  ]);

  if (!customerId) {
    return { status: "not-applicable" };
  }

  const cartLines: CartLineForPricing[] = (cart?.lines?.nodes ?? [])
    .map((node) => ({
      id: node.id,
      variantId: node.merchandise?.id ?? "",
      quantity: node.quantity,
    }))
    .filter((line) => line.variantId);

  if (cartLines.length === 0) {
    return { status: "not-applicable" };
  }

  if (!market) {
    return { status: "unavailable", retryable: true };
  }

  const { lines, sources } = mergeLines(cartLines);
  // Merging drops quantities Shopify would not keep anyway. Being left with
  // nothing means there is no cart to price, which is not a failure — sending
  // it would earn an `INVALID_REQUEST` and tell the buyer that wholesale
  // pricing is down when their cart is simply empty.
  if (lines.length === 0) {
    return { status: "not-applicable" };
  }

  const result = await fetchCartPricing(env, {
    domain: env.PUBLIC_STORE_DOMAIN,
    customerId,
    lines,
    market,
  });

  if (result.kind === "failed") {
    const { action } = result.failure;
    return {
      status: "unavailable",
      retryable: action === "RETRY_BACKOFF" || action === "RETRY_LATER",
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
