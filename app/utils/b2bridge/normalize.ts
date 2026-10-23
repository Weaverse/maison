import type {
  Group,
  RawGroup,
  RawRule,
  RawRuleVariant,
  RawVolumeTier,
  Rule,
  RuleVariant,
  VolumeTier,
} from "./types";

/**
 * The single boundary between B2Bridge's wire format and the rest of Maison.
 *
 * The API mixes JSON-in-string with real objects, strings with numbers, and
 * `snake_case` on the detail endpoints with `camelCase` on the list ones. Every
 * one of those inconsistencies is absorbed here so no caller has to remember
 * which field is which shape.
 */

/**
 * Parses a field that holds JSON inside a string.
 *
 * Returns the fallback for anything unusable rather than throwing: the API has
 * been observed to send `""` for an unset `volume_table` and the literal string
 * `"null"` for an unset `nt_time_custom`, and a pricing page must not 500
 * because a merchant left a field blank.
 */
export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null || value === "") {
    return fallback;
  }
  if (typeof value !== "string") {
    // Already decoded — `applied_markets` arrives this way.
    return value as T;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

/** Coerces the API's mix of numeric strings and numbers to a number. */
function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/** Same as `toNumber` but keeps `null` distinct from zero — `maximum` needs it. */
function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTiers(value: unknown): VolumeTier[] {
  const raw = parseJsonField<RawVolumeTier[]>(value, []);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((tier) => tier && typeof tier === "object")
    .map((tier) => ({
      fromQuantity: toNumber(tier.volume_pricing_from, 0),
      type: String(tier.volume_pricing_type ?? "PERCENT").toUpperCase(),
      value: toNumber(tier.volume_pricing_value, 0),
    }))
    .filter((tier) => tier.fromQuantity > 0)
    .sort((a, b) => a.fromQuantity - b.fromQuantity);
}

function normalizeRuleVariant(raw: RawRuleVariant): RuleVariant {
  return {
    variantId: String(raw.variant_id),
    productId: String(raw.product_id),
    price: toNumber(raw.price, 0),
    originPrice: toNumber(raw.origin_price, 0),
    minimum: toNullableNumber(raw.minimum),
    maximum: toNullableNumber(raw.maximum),
    incrementQuantity: toNullableNumber(raw.increment_quantity),
    volumePricing: normalizeTiers(raw.volume_pricing),
    isHidden: raw.is_hidden === true,
  };
}

export function normalizeRule(raw: RawRule): Rule {
  // `applied_markets` maps a Shopify market id to its country codes. Only the
  // countries matter here: a market id would have to be resolved through the
  // Admin API, whereas the storefront already knows its own country.
  const appliedMarkets = parseJsonField<Record<string, string[]>>(
    raw.applied_markets,
    {},
  );
  const appliedCountries = Object.values(appliedMarkets)
    .flat()
    .filter((code): code is string => typeof code === "string")
    .map((code) => code.toUpperCase());

  return {
    id: raw.id,
    name: raw.name,
    enabled: toNumber(raw.status, 0) === 1,
    priority: toNumber(raw.priority, 0),
    // Observed lowercase (`"all"`) where the docs promise uppercase, so every
    // enum-ish field is upper-cased before anyone compares it.
    marketConditionType: String(
      raw.market_condition_type ?? "ALL",
    ).toUpperCase(),
    appliedCountries: [...new Set(appliedCountries)],
    discountType: String(raw.discount_type ?? "PERCENT").toUpperCase(),
    discountValue: toNumber(raw.discount_value, 0),
    discountDirection: String(
      raw.discount_direction ?? "DECREASE",
    ).toUpperCase(),
    volumeType: String(raw.volume_type ?? "NO_LIMIT").toUpperCase(),
    volumeApply: String(raw.volume_apply ?? "EVERY_PRODUCT").toUpperCase(),
    volumeTable: normalizeTiers(raw.volume_table),
    limitType: String(raw.limit_type ?? "NO_LIMIT").toUpperCase(),
    minimum: toNumber(raw.minimum, 0),
    maximum: toNullableNumber(raw.maximum),
    incrementQuantity: toNumber(raw.increment_quantity, 0),
    startDate: raw.start_date ?? null,
    endDate: raw.enable_end_date === 1 ? (raw.end_date ?? null) : null,
    variants: Array.isArray(raw.pricingListVariants)
      ? raw.pricingListVariants.map(normalizeRuleVariant)
      : [],
  };
}

export function normalizeGroup(raw: RawGroup): Group {
  return {
    id: raw.id,
    name: raw.name,
    customerTag: raw.customer_tags || null,
    customerIds: parseJsonField<string[]>(raw.customer_ids, []).map(String),
    pricingRuleIds: parseJsonField<number[]>(raw.pricing_rule_ids, []).map(
      (id) => toNumber(id, 0),
    ),
  };
}
