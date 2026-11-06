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
