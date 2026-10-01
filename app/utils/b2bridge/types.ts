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
