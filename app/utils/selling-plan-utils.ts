import type { SellingPlanGroupFragment } from "storefront-api.generated";

type SellingPlan = SellingPlanGroupFragment["sellingPlans"]["nodes"][number];

/**
 * Format selling plan name for display
 * @example "Deliver every month" → "Deliver every month"
 * @example "Subscribe & Save" → "Subscribe & Save"
 */
export function formatSellingPlanName(plan: SellingPlan): string {
  return plan.name || "Subscription";
}

/**
 * Extract discount text from selling plan
 * Returns formatted discount string or null if no discount
 * @example "Save 10%" or "Save $5.00"
 */
export function getDiscountText(plan: SellingPlan): string | null {
  const priceAdjustment = plan.priceAdjustments?.[0];
  if (!priceAdjustment) {
    return null;
  }

  const adjustmentValue = priceAdjustment.adjustmentValue;
  if (!adjustmentValue) {
    return null;
  }

  if ("adjustmentPercentage" in adjustmentValue) {
    return `Save ${adjustmentValue.adjustmentPercentage}%`;
  }

  if (
    "adjustmentAmount" in adjustmentValue &&
    adjustmentValue.adjustmentAmount
  ) {
    const amount = adjustmentValue.adjustmentAmount.amount;
    const currencyCode = adjustmentValue.adjustmentAmount.currencyCode;
    return `Save ${currencyCode} ${amount}`;
  }

  return null;
}

/**
 * Get all available selling plans for the product
 * Filters out empty groups and returns flattened list
 */
export function getAvailableSellingPlans(sellingPlanGroups: {
  nodes: SellingPlanGroupFragment[];
}): SellingPlan[] {
  if (!sellingPlanGroups?.nodes?.length) {
    return [];
  }

  const plans: SellingPlan[] = [];

  for (const group of sellingPlanGroups.nodes) {
    if (group.sellingPlans?.nodes?.length) {
      plans.push(...group.sellingPlans.nodes);
    }
  }

  return plans;
}

/**
 * Get selling plan by ID from groups
 */
export function getSellingPlanById(
  sellingPlanGroups: { nodes: SellingPlanGroupFragment[] },
  planId: string,
): SellingPlan | null {
  const allPlans = getAvailableSellingPlans(sellingPlanGroups);
  return allPlans.find((plan) => plan.id === planId) || null;
}

/**
 * Calculate the adjusted price when a selling plan is applied
 * Handles: Fixed price, Fixed amount off, Percentage off
 */
export function calculateSellingPlanPrice(
  originalPrice: { amount: string; currencyCode: string },
  plan: SellingPlan,
): { amount: string; currencyCode: string } {
  const priceAdjustment = plan?.priceAdjustments?.[0];
  const adjustmentValue = priceAdjustment?.adjustmentValue;

  if (!adjustmentValue) {
    return originalPrice;
  }

  // Fixed price
  if ("price" in adjustmentValue && adjustmentValue.price) {
    return adjustmentValue.price;
  }

  // Fixed amount off
  if (
    "adjustmentAmount" in adjustmentValue &&
    adjustmentValue.adjustmentAmount
  ) {
    return {
      amount: String(
        Number(originalPrice.amount) -
          Number(adjustmentValue.adjustmentAmount.amount),
      ),
      currencyCode: originalPrice.currencyCode,
    };
  }

  // Percentage off
  if (
    "adjustmentPercentage" in adjustmentValue &&
    adjustmentValue.adjustmentPercentage
  ) {
    return {
      amount: String(
        Number(originalPrice.amount) *
          (1 - adjustmentValue.adjustmentPercentage / 100),
      ),
      currencyCode: originalPrice.currencyCode,
    };
  }

  return originalPrice;
}
