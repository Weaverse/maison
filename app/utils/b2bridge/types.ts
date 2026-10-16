/**
 * Shapes as the B2Bridge Public API actually returns them, which is not what
 * its documentation describes. Captured from
 * `https://b2bridge-public-api.b2bridge.io` against `maison-plus-2.myshopify.com`.
 *
 * Two quirks drive every `Raw*` type below:
 *
 * 1. Several fields are JSON encoded *inside a string* (`volume_table`,
 *    `volume_pricing`, `pricing_rule_ids`, `customer_ids`, `payment_options`),
 *    while a neighbouring field of the same kind — `applied_markets` — is a
 *    real object. Nothing signals which is which, so each one is parsed by name.
 * 2. Numbers arrive as strings in some fields (`discount_value`, `minimum`) and
 *    as numbers in others (`price`, `origin_price`).
 *
 * Nothing outside `normalize.ts` should touch these types. Everything else
 * works on the clean shapes at the bottom of this file.
 */

/** A rule as returned by `pricing-lists/get-by-id`. */
export interface RawRule {
  id: number;
  shop_id: number;
  name: string;
  status: number;
  priority: number;
  variant_visibility?: string;
  market_condition_type?: string;
  /** Market id → country codes. Object, not a JSON string. */
  applied_markets?: Record<string, string[]> | null;
  discount_type?: string;
  discount_value?: string | number;
  /** Undocumented. Observed values: "DECREASE". */
  discount_direction?: string;
  volume_type?: string;
  volume_apply?: string;
  /** JSON-encoded `RawVolumeTier[]`, or an empty string. */
  volume_table?: string;
  limit_type?: string;
  limit_apply?: string;
  minimum?: string | number;
  maximum?: string | number | null;
  increment_quantity?: number;
  start_date?: string | null;
  end_date?: string | null;
  enable_end_date?: number;
  pricingListVariants?: RawRuleVariant[];
}

export interface RawVolumeTier {
  volume_pricing_from: number;
  volume_pricing_type: string;
  volume_pricing_value: number;
  /** Undocumented. Observed value: "product". */
  unit_of_measure?: string;
}

export interface RawRuleVariant {
  /** Shopify variant id as a bare number in a string — no `gid://` prefix. */
  variant_id: string;
  product_id: string;
  price: number;
  origin_price: number;
  minimum?: number | null;
  maximum?: number | null;
  increment_quantity?: number | null;
  order_limit_by?: string;
  /** JSON-encoded `RawVolumeTier[]`. Per-variant override of `volume_table`. */
  volume_pricing?: string;
  volume_limit_by?: string;
  /** Undocumented. Hides the variant when the rule applies. */
  is_hidden?: boolean;
}

/** A group as returned by `customer-groups/get-by-domain`. */
export interface RawGroup {
  id: number;
  name: string;
  /** Single tag, despite the plural name. Convention: starts with `b2b-`. */
  customer_tags?: string | null;
  /** JSON-encoded `string[]` of numeric Shopify customer ids. */
  customer_ids?: string | null;
  /** JSON-encoded `number[]`. */
  pricing_rule_ids?: string | null;
}

// --- Clean shapes: everything below this line is what the rest of the code uses.

export interface VolumeTier {
  fromQuantity: number;
  /** "PERCENT" | "FIXED" | "NEW" */
  type: string;
  value: number;
}

export interface RuleVariant {
  variantId: string;
  productId: string;
  price: number;
  originPrice: number;
  minimum: number | null;
  maximum: number | null;
  incrementQuantity: number | null;
  volumePricing: VolumeTier[];
  isHidden: boolean;
}

export interface Rule {
  id: number;
  name: string;
  /** `status: 1` in the API. */
  enabled: boolean;
  priority: number;
  marketConditionType: string;
  /** Flattened union of every country code in `applied_markets`. */
  appliedCountries: string[];
  discountType: string;
  discountValue: number;
  discountDirection: string;
  volumeType: string;
  volumeApply: string;
  volumeTable: VolumeTier[];
  limitType: string;
  minimum: number;
  maximum: number | null;
  incrementQuantity: number;
  startDate: string | null;
  endDate: string | null;
  variants: RuleVariant[];
}

export interface Group {
  id: number;
  name: string;
  customerTag: string | null;
  customerIds: string[];
  pricingRuleIds: number[];
}

/**
 * What the loader overlays onto a Shopify variant. Field names deliberately
 * mirror the Storefront API so consumers cannot tell the difference — see
 * `app/sections/variant-list/variant-row.tsx` and
 * `app/components/product/variant-prices.tsx`.
 */
export interface VariantOverlay {
  price: { amount: string; currencyCode: string };
  quantityPriceBreaks: {
    nodes: {
      minimumQuantity: number;
      price: { amount: string; currencyCode: string };
    }[];
  };
  quantityRule?: {
    minimum: number;
    maximum: number | null;
    increment: number;
  };
}

// --- Headless Cart & Checkout API ---------------------------------------------
//
// A second, newer set of endpoints, added after B2Bridge agreed on 2026-10-12
// to support headless storefronts. Unlike the Price List API above, these
// return prices that have already been evaluated, so nothing below needs
// normalising — the shapes are what the wire actually carries, captured from
// `maison-plus-2.myshopify.com` on 2026-10-13.

/** The subset of a Shopify cart line that pricing depends on. */
export interface CartLineForPricing {
  /** Cart line id, kept so a priced line can be mapped back to the UI. */
  id: string;
  variantId: string;
  quantity: number;
}

export interface HeadlessRequest {
  /** The shop's `*.myshopify.com` domain. */
  domain: string;
  /** Shopify customer id, already verified through the Customer Account API. */
  customerId: string;
  /** One entry per variant — see `mergeLines` in `headless.ts`. */
  lines: { variantId: string; quantity: number }[];
  /**
   * Sent whenever it is known. A rule can be scoped to specific markets, and
   * leaving this out does not raise an error — it silently skips the market
   * check and can price the buyer against a rule that does not apply to them.
   */
  market?: { id: string; countryCode: string };
  /** Shopify B2B only: the company location the buyer is ordering for. */
  companyLocationId?: string;
}

export interface PricedLine {
  /** Always a GID in the response, whichever form was sent. */
  variantId: string;
  productId: string;
  quantity: number;
  /** Shopify's own price, for a strikethrough. Never charge this. */
  originalUnitPrice: number;
  /** The B2B unit price. This is the one to show. */
  unitPrice: number;
  lineTotal: number;
  /** `false` means no rule applies and `unitPrice` is the Shopify price. */
  hasRule: boolean;
  minimum: number | null;
  maximum: number | null;
  /** Returned for the quantity selector. The API does not enforce it. */
  increment: number;
}

/**
 * An order-limit violation.
 *
 * These arrive on a perfectly successful `200` with `success: true` — a cart
 * below its minimum is a state to render, not a failure to catch.
 */
export interface LimitError {
  scope: "VARIANT" | "PRODUCT" | "PRICE_LIST";
  code: "BELOW_MINIMUM" | "ABOVE_MAXIMUM";
  limitBy: "QUANTITY" | "AMOUNT";
  /** Present when `scope` is `VARIANT`. Bare id, not a GID. */
  variantId?: string;
  /** Present when `scope` is `PRODUCT`. */
  productId?: string;
  minimum: number | null;
  maximum: number | null;
  current: number;
  /** Ready to display, English only. */
  message: string;
}

export interface CartPricing {
  success: true;
  /** Shop currency, which is not necessarily the market's currency. */
  currency: string;
  lines: PricedLine[];
  /** Sum of `lineTotal`. Excludes tax, shipping and Shopify discounts. */
  subtotal: number;
  errors: LimitError[];
  /** `true` only when `errors` is empty. */
  canCheckout: boolean;
}

export interface CheckoutResult extends CartPricing {
  draftOrderId: string;
  /** Where to send the buyer to pay. */
  invoiceUrl: string;
}

/** What the storefront should do about a failed call. */
export type FailureAction =
  | "RETRY_BACKOFF"
  | "RETRY_LATER"
  | "SHOW_ERRORS"
  | "DROP_LINES"
  | "FIX_REQUEST"
  | "BLOCK";

export interface Failure {
  action: FailureAction;
  /** `null` for a rate limit and for the gateway's auth replies, which carry none. */
  code: string | null;
  /** `0` when the request never got an answer. */
  status: number;
  message: string;
  details?: unknown;
}

/** One cart line, priced. Amounts are in `CartPricingState["currency"]`. */
export interface PricedCartLine {
  /** Bare variant id, so it can be looked up from `lineVariants`. */
  variantId: string;
  /** Bare product id. Tiers are reached on a product's combined quantity. */
  productId: string;
  /** The merged quantity across every cart line of this variant. */
  quantity: number;
  originalUnitPrice: number;
  unitPrice: number;
  /** For the merged quantity, not for any single cart line. */
  lineTotal: number;
  hasRule: boolean;
  minimum: number | null;
  maximum: number | null;
  increment: number;
}

/**
 * What the cart UI is told about B2Bridge pricing.
 *
 * Three states, and the difference between the last two is the whole point.
 * `not-applicable` means B2Bridge should not price this cart — a guest, a
 * buyer in no group, an unconfigured shop — and Shopify's own price is then
 * the right one to show and to charge. `unavailable` means B2Bridge should
 * have priced it and could not, which is the case where Shopify's price is
 * the *wrong* number and checkout has to stop.
 *
 * Nothing here carries an internal error string: a failure reaches the browser
 * as a state, not as a reason.
 */
export type CartPricingState = (
  | { status: "not-applicable" }
  | { status: "unavailable"; retryable: boolean }
  | {
      status: "priced";
      currency: string;
      subtotal: number;
      canCheckout: boolean;
      lines: PricedCartLine[];
      errors: LimitError[];
      /** Cart line id → bare variant id, to map merged lines back to the UI. */
      lineVariants: Record<string, string>;
    }
) & {
  /**
   * An invoice was raised for this session and has not been settled yet.
   *
   * Orthogonal to the pricing, which is why it rides alongside rather than
   * inside it: a cart can be empty, unpriceable or perfectly priced and still
   * have an unpaid invoice waiting behind it.
   */
  pendingDraft?: boolean;
};

/**
 * What the cart is told after the buyer clicks checkout.
 *
 * `limits` is kept apart from `unavailable` because the buyer can fix it:
 * their cart broke an order rule and the cart will say which. `unavailable`
 * is ours or B2Bridge's problem and leaves them nothing to act on.
 *
 * `not-applicable` means B2Bridge should not price this cart at all, so
 * Shopify's own checkout is the right place to send them.
 */
export type CheckoutState =
  | {
      status: "ok";
      /** Where to send the buyer to pay. */
      invoiceUrl: string;
      /** Priced again at this moment; may differ from what the cart showed. */
      subtotal: number;
      currency: string;
    }
  | { status: "limits" }
  | { status: "unavailable"; retryable: boolean }
  | { status: "not-applicable" };
