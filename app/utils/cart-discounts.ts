type MoneyLike = { amount: string; currencyCode: string };

type DiscountAllocation = {
  discountedAmount: MoneyLike;
  /** Only present on `CartCodeDiscountAllocation`. */
  code?: string;
};

type CartLike = {
  discountAllocations?: DiscountAllocation[] | null;
  lines?: {
    nodes?: Array<{ discountAllocations?: DiscountAllocation[] | null } | null>;
  } | null;
};

export type CartDiscounts = {
  /** Every discount taken off the cart, cart-level and line-level combined. */
  total: number;
  /** Amount attributed to each discount code, summed across all the lines it hit. */
  byCode: Map<string, number>;
};

/**
 * A discount code can land in either place depending on what it targets: an
 * order-wide discount allocates on the cart, while one scoped to specific
 * products allocates on each line it applies to. Reading only the cart level
 * would report 0 for the latter, so both are summed here.
 */
export function getCartDiscounts(cart?: CartLike | null): CartDiscounts {
  const allocations = [
    ...(cart?.discountAllocations ?? []),
    ...(cart?.lines?.nodes ?? []).flatMap(
      (line) => line?.discountAllocations ?? [],
    ),
  ];

  let total = 0;
  const byCode = new Map<string, number>();

  for (const allocation of allocations) {
    const amount = Number(allocation?.discountedAmount?.amount || 0);
    if (!amount) {
      continue;
    }
    total += amount;
    if (allocation.code) {
      byCode.set(allocation.code, (byCode.get(allocation.code) ?? 0) + amount);
    }
  }

  return { total, byCode };
}

/** Look a code's amount up case-insensitively — Shopify echoes it in the merchant's casing. */
export function getDiscountAmount(
  byCode: CartDiscounts["byCode"],
  code: string,
): number | null {
  for (const [appliedCode, amount] of byCode) {
    if (appliedCode.toLowerCase() === code.toLowerCase()) {
      return amount;
    }
  }
  return null;
}
