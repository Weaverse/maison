export interface CartOwnerMarker {
  cartId: string;
  customerSubject: string | null;
}

export const EXPIRED_CART_COOKIE = "cart=; Path=/; Max-Age=0; SameSite=Lax";

export type CartAccess = "keep" | "adopt" | "reset";

export function unavailableCart<T extends object>(cart: T): T {
  return new Proxy(cart, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      if (key === "get" || key === "getCartId" || typeof value !== "function") {
        return value;
      }
      return function unavailableCartMutation() {
        throw new Response("Cart identity unavailable", { status: 503 });
      };
    },
  });
}

/**
 * How handing a guest cart to a signed-in buyer ended.
 *
 * `refused` is Shopify answering about this cart: it cannot be adopted, and
 * there is nothing to keep. `unreachable` is Shopify not answering at all — a
 * 503, a dropped connection, a transport-level error — which says nothing
 * about the cart, so the shopper must not lose it over one.
 */
export type AdoptionOutcome = "adopted" | "refused" | "unreachable";

export function adoptionOutcome(
  result: {
    cart?: { id?: string } | null;
    errors?: unknown[] | null;
    userErrors?: unknown[] | null;
  } | null,
  error?: unknown,
): AdoptionOutcome {
  if (error || !result) {
    return "unreachable";
  }
  if (result.userErrors?.length) {
    return "refused";
  }
  if (!result.cart?.id || result.errors?.length) {
    return "unreachable";
  }
  return "adopted";
}

/**
 * What an adoption outcome does to the cart the shopper is already holding.
 *
 * `release` gives it up — the cookie expires and the signed marker goes.
 * `withhold` keeps both and only takes the cart out of reach for this one
 * request, so the next can try again. The distinction is the whole point:
 * Shopify being unreachable must never cost a shopper the cart they filled,
 * and this mapping is what holds that line.
 */
export type CartDisposition = "keep" | "withhold" | "release";

export function adoptionDisposition(outcome: AdoptionOutcome): CartDisposition {
  if (outcome === "adopted") {
    return "keep";
  }
  return outcome === "refused" ? "release" : "withhold";
}

/** A missing or malformed signed marker is never evidence of a guest cart. */
export function cartAccess(
  cartId: string,
  marker: unknown,
  customerSubject: string | null,
): CartAccess {
  if (
    !marker ||
    typeof marker !== "object" ||
    !("cartId" in marker) ||
    !("customerSubject" in marker) ||
    marker.cartId !== cartId ||
    !(
      marker.customerSubject === null ||
      (typeof marker.customerSubject === "string" &&
        marker.customerSubject.length > 0)
    )
  ) {
    return "reset";
  }

  if (marker.customerSubject === customerSubject) {
    return "keep";
  }
  return marker.customerSubject === null && customerSubject !== null
    ? "adopt"
    : "reset";
}
