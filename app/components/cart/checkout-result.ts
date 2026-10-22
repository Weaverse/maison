import type { CheckoutState } from "~/utils/b2bridge/types";

/** A fetcher response is useful only for the cart that submitted it. */
export interface CheckoutResultTracker {
  cartKey: string;
  submittedKey: string | null;
  previousData: CheckoutState | undefined;
  invalidated: boolean;
}

export function beginCheckout(
  cartKey: string,
  previousData: CheckoutState | undefined,
): CheckoutResultTracker {
  return {
    cartKey,
    submittedKey: cartKey,
    previousData,
    invalidated: false,
  };
}

export function checkoutResultForCart(
  tracker: CheckoutResultTracker,
  cartKey: string,
  data: CheckoutState | undefined,
): { tracker: CheckoutResultTracker; result: CheckoutState | undefined } {
  // Once the buyer changes carts, returning to the same quantities must not
  // revive an old invoice. Only another explicit checkout begins a new scope.
  const current =
    tracker.cartKey === cartKey
      ? tracker
      : { ...tracker, cartKey, invalidated: true };
  const result =
    !current.invalidated &&
    current.submittedKey === cartKey &&
    data !== current.previousData
      ? data
      : undefined;
  return { tracker: current, result };
}
