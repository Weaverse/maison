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
  /**
   * Allocated on the cart itself. `CartCost.subtotalAmount` is documented as
   * "before taxes and cart-level discounts", so this part has NOT been taken
   * off it yet.
   */
  cartLevel: number;
  /**
   * Allocated on the lines. `CartCost.subtotalAmount` sums the line totals,
   * which are already net of these, so this part HAS been taken off it. Add it
   * back to show a subtotal that precedes every discount.
   */
  lineLevel: number;
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
  const byCode = new Map<string, number>();
  let cartLevel = 0;
  let lineLevel = 0;

  const collect = (
    allocations: DiscountAllocation[] | null | undefined,
    add: (amount: number) => void,
  ) => {
    for (const allocation of allocations ?? []) {
      const amount = Number(allocation?.discountedAmount?.amount || 0);
      if (!amount) {
        continue;
      }
      add(amount);
      if (allocation.code) {
        byCode.set(
          allocation.code,
          (byCode.get(allocation.code) ?? 0) + amount,
        );
      }
    }
  };

  collect(cart?.discountAllocations, (amount) => {
    cartLevel += amount;
  });
  for (const line of cart?.lines?.nodes ?? []) {
    collect(line?.discountAllocations, (amount) => {
      lineLevel += amount;
    });
  }

  return { total: cartLevel + lineLevel, cartLevel, lineLevel, byCode };
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
