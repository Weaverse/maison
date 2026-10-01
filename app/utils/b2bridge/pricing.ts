import type { Rule, RuleVariant, VariantOverlay, VolumeTier } from "./types";

/**
 * Turns a B2Bridge rule into the exact shapes the Storefront API would have
 * returned, so the components that already render Shopify's B2B fields render
 * these without knowing the difference.
 *
 * Everything here is pure, so `scripts/b2bridge-probe.mjs` can exercise it
 * against captured fixtures without a network or a running app.
 */

/** Money needs exactly two decimals; `325 * 0.95` does not give them in binary. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function money(amount: number, currencyCode: string) {
  return { amount: round2(amount).toFixed(2), currencyCode };
}

/**
 * A rule scoped to specific markets only applies where the storefront's own
 * country is one of them.
 *
 * `applied_markets` is keyed by Shopify market id, but the values are country
 * codes, so the market id never has to be resolved — the storefront already
 * knows which country it is serving.
 */
export function marketApplies(rule: Rule, country: string): boolean {
  if (rule.marketConditionType !== "SPECIFIC") {
    return true;
  }
  // A rule marked SPECIFIC with no countries listed matches nothing. Treating
  // it as "all" would be the dangerous reading: it would price every market.
  return rule.appliedCountries.includes(country.toUpperCase());
}

/**
 * B2Bridge's rule dates arrive as `"2026-09-28 04:30:33.269"` — no timezone
 * marker — while the `created_at` on the same record is ISO-8601 UTC
 * (`"2026-09-28T04:32:35.404Z"`). On rule 8985 those two are two minutes
 * apart, which they could not be if the first were local time in a +07 shop.
 * So the dates are UTC, spelled without the `Z`, and are read as UTC here —
 * the same convention Shopify's own API timestamps use. Reading them in the
 * server's local zone instead would shift a rule's start by hours.
 */
function parseRuleDate(value: string): Date {
  return new Date(`${value.trim().replace(" ", "T")}Z`);
}

/** Disabled rules and rules outside their date window never price anything. */
export function ruleIsActive(rule: Rule, now: Date = new Date()): boolean {
  if (!rule.enabled) {
    return false;
  }
  if (rule.startDate) {
    const start = parseRuleDate(rule.startDate);
    if (!Number.isNaN(start.getTime()) && start > now) {
      return false;
    }
  }
  if (rule.endDate) {
    const end = parseRuleDate(rule.endDate);
    if (!Number.isNaN(end.getTime()) && end < now) {
      return false;
    }
  }
  return true;
}

/**
 * Whether this rule's shape can be represented in Shopify's fields at all.
 *
 * Two shapes cannot, and rendering an approximation of either would show a
 * wrong number:
 *
 * - `volume_type: AMOUNT` prices by money spent, but `quantityPriceBreaks`
 *   only has `minimumQuantity`. There is nowhere to put it.
 * - `volume_apply: TOTAL_PRODUCT` makes a tier depend on the combined quantity
 *   of every product in the list, so a variant's price is not knowable on a
 *   product page — it depends on the rest of the cart.
 *
 * Both are skipped rather than approximated. See the plan's out-of-scope note.
 */
export function volumeIsRepresentable(rule: Rule): boolean {
  if (rule.volumeType === "NO_LIMIT") {
    return true; // No tiers to represent; the base price still applies.
  }
  return rule.volumeType === "QUANTITY" && rule.volumeApply === "EVERY_PRODUCT";
}

/**
 * The rule's base price for one variant, before any volume tier.
 *
 * `price` on the variant row is only authoritative for `CUSTOMIZE` — the docs
 * say it otherwise just mirrors `origin_price` — so every other discount type
 * is computed from `origin_price` here.
 */
export function basePrice(rule: Rule, variant: RuleVariant): number {
  const origin = variant.originPrice;
  const sign = rule.discountDirection === "INCREASE" ? 1 : -1;

  switch (rule.discountType) {
    case "CUSTOMIZE":
      return variant.price;
    case "NEW":
      return rule.discountValue;
    case "FIXED":
      return Math.max(0, origin + sign * rule.discountValue);
    default:
      // PERCENT
      return Math.max(0, origin * (1 + (sign * rule.discountValue) / 100));
  }
}

/**
 * Applies one volume tier on top of the rule's base price.
 *
 * `PERCENT` and `FIXED` tiers **stack** on the base rather than replacing it:
 * a 3% base discount plus a 5% tier at qty 10 charges `origin × 0.97 × 0.95`.
 *
 * This is measured, not inferred. B2Bridge's own checkout sends Shopify a
 * draft order with `priceOverride: { amount: 299.49 }` for a $325 variant
 * under exactly that rule — and `325 × 0.97 × 0.95 = 299.4875`, while the
 * non-stacking reading would give `325 × 0.95 = 308.75`.
 *
 * `NEW` stays absolute: it names the price outright, so there is nothing to
 * stack it onto.
 */
export function tierPrice(tier: VolumeTier, base: number): number {
  switch (tier.type) {
    case "NEW":
      return tier.value;
    case "FIXED":
      return Math.max(0, base - tier.value);
    default:
      // PERCENT
      return Math.max(0, base * (1 - tier.value / 100));
  }
}

/**
 * The quantity rule for one variant, or `undefined` when the rule sets none.
 *
 * Returning `undefined` rather than `null` matters:
 * `app/sections/variant-list/variant-row.tsx:333` reads
 * `variant.quantityRule.increment` without a guard, so the Shopify default must
 * be left in place instead of being overwritten with an empty value.
 */
export function quantityRuleFor(
  rule: Rule,
  variant: RuleVariant,
): VariantOverlay["quantityRule"] {
  if (rule.limitType === "NO_LIMIT") {
    return undefined;
  }
  const perVariant = rule.limitType === "CUSTOMIZE";
  const minimum = perVariant ? (variant.minimum ?? 0) : rule.minimum;
  const maximum = perVariant ? variant.maximum : rule.maximum;
  const increment = perVariant
    ? (variant.incrementQuantity ?? 1)
    : rule.incrementQuantity;

  // A minimum of zero is how B2Bridge spells "no minimum"; Shopify's contract
  // is that a variant is orderable from 1 upward.
  return {
    minimum: Math.max(1, minimum || 1),
    maximum: maximum && maximum > 0 ? maximum : null,
    increment: Math.max(1, increment || 1),
  };
}

/**
 * The full overlay for one variant, or `null` when the rule does not price it.
 *
 * `currencyCode` is taken from the Shopify variant and never invented:
 * B2Bridge returns bare numbers with no currency attached.
 */
export function buildOverlay(
  rule: Rule,
  variant: RuleVariant,
  currencyCode: string,
): VariantOverlay | null {
  if (variant.isHidden || !volumeIsRepresentable(rule)) {
    return null;
  }

  // A per-variant table overrides the rule-wide one; this is what
  // `volume_type: CUSTOMIZE` means in practice.
  const tiers =
    variant.volumePricing.length > 0 ? variant.volumePricing : rule.volumeTable;
  const base = basePrice(rule, variant);

  return {
    price: money(base, currencyCode),
    quantityPriceBreaks: {
      nodes: tiers.map((tier) => ({
        minimumQuantity: tier.fromQuantity,
        price: money(tierPrice(tier, base), currencyCode),
      })),
    },
    quantityRule: quantityRuleFor(rule, variant),
  };
}

/**
 * Picks the winning rule when a buyer's groups point at several.
 *
 * Higher `priority` wins. B2Bridge does not document a tie-break, so the lower
 * id — the older rule — wins, which at least makes the outcome stable across
 * requests instead of depending on response order. Open question for B2Bridge.
 */
export function pickRule(rules: Rule[], country: string): Rule | null {
  const eligible = rules.filter(
    (rule) => ruleIsActive(rule) && marketApplies(rule, country),
  );
  if (eligible.length === 0) {
    return null;
  }
  return eligible.sort((a, b) => b.priority - a.priority || a.id - b.id)[0];
}

/**
 * Maps every variant a rule prices to its overlay, keyed by the bare numeric
 * variant id that B2Bridge uses.
 */
export function overlaysForRule(
  rule: Rule,
  currencyCode: string,
): Map<string, VariantOverlay> {
  const overlays = new Map<string, VariantOverlay>();
  for (const variant of rule.variants) {
    const overlay = buildOverlay(rule, variant, currencyCode);
    if (overlay) {
      overlays.set(variant.variantId, overlay);
    }
  }
  return overlays;
}
