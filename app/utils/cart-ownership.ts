export interface CartOwnerMarker {
  cartId: string;
  customerSubject: string | null;
}

export const EXPIRED_CART_COOKIE = "cart=; Path=/; Max-Age=0; SameSite=Lax";

export type CartAccess = "keep" | "adopt" | "reset";

/**
 * The request's context with its cart put out of reach.
 *
 * A proxy rather than an assignment: `createHydrogenContext` returns its own
 * proxy that reports `cart` as read-only, so writing over it throws.
 *
 * Kept here, beside the rules that decide when a cart is withheld and away
 * from anything that reaches for a section component, so a test can drive it
 * with Hydrogen's real cart handler and watch a mutation stop before it
 * becomes a Shopify request.
 */
export function withheldCartContext<C extends object>(context: C): C {
  const guardedCart = unavailableCart((context as { cart: object }).cart);
  return new Proxy(context, {
    get(target, key, receiver) {
      return key === "cart" ? guardedCart : Reflect.get(target, key, receiver);
    },
  });
}

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

/**
 * What a request may do with the cart before anything touches Shopify.
 *
 * `none` is the ordinary case of a browser carrying no cart at all. The rest
 * follow `cartAccess`.
 *
 * Deciding this before `cartId` is even looked at is the point: an account we
 * cannot identify must not be able to create a cart either. Gated behind a
 * cart cookie, a failed token refresh on a browser holding none left the
 * guard off entirely — `addLines` reached Shopify, a cart was created there,
 * and only then did writing its id back fail. The shopper got an error with
 * nothing saved, and every retry left another cart behind.
 */
export type CartGate = "withhold" | "reset" | "adopt" | "keep" | "none";

export function cartGate({
  customerSubject,
  cartId,
  marker,
}: {
  customerSubject: string | null | undefined;
  cartId: string | undefined;
  marker: unknown;
}): CartGate {
  if (customerSubject === undefined) {
    return "withhold";
  }
  if (!cartId) {
    return "none";
  }
  return cartAccess(cartId, marker, customerSubject);
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
