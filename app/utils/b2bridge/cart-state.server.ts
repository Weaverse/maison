import type { LoaderFunctionArgs } from "react-router";

type Context = LoaderFunctionArgs["context"];

// This serializes this worker's checkout and settlement mutations for one cart.
// Shopify cart attributes have no conditional-write primitive, so this is not
// a distributed lock across Oxygen instances.
const CART_LOCKS = new Map<string, Promise<void>>();

export async function withCartMutationLock<T>(
  context: Context,
  task: () => Promise<T>,
): Promise<T> {
  const cartId = context.cart.getCartId() ?? (await context.cart.get())?.id;
  if (!cartId) {
    throw new Error("Cannot lock a cart without an id");
  }

  const previous = CART_LOCKS.get(cartId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>(function createLock(resolve) {
    release = resolve;
  });
  const queued = previous.then(function waitForPrevious() {
    return current;
  });
  CART_LOCKS.set(cartId, queued);

  await previous;
  try {
    return await task();
  } finally {
    release();
    if (CART_LOCKS.get(cartId) === queued) {
      CART_LOCKS.delete(cartId);
    }
  }
}

/** cartAttributesUpdate replaces the entire set, so retain unrelated keys. */
export async function writeCartAttributes(
  context: Context,
  changes: Record<string, string | null>,
): Promise<void> {
  const cart = await context.cart.get();
  if (!cart?.id) {
    throw new Error("Cannot save checkout state without a cart");
  }

  const merged = new Map<string, string>();
  for (const attribute of cart.attributes ?? []) {
    if (attribute.key && attribute.value != null) {
      merged.set(attribute.key, attribute.value);
    }
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) {
      merged.delete(key);
    } else {
      merged.set(key, value);
    }
  }

  const result = await context.cart.updateAttributes(
    [...merged].map(function toAttribute([key, value]) {
      return { key, value };
    }),
  );
  if (
    !result?.cart?.id ||
    result.cart.id !== cart.id ||
    (result.errors?.length ?? 0) > 0 ||
    (result.userErrors?.length ?? 0) > 0
  ) {
    throw new Error("Shopify refused the cart attributes update");
  }

  const saved = new Map(
    (result.cart.attributes ?? []).map(function toEntry(attribute) {
      return [attribute.key, attribute.value] as const;
    }),
  );
  for (const [key, value] of merged) {
    if (saved.get(key) !== value) {
      throw new Error(`Shopify did not persist cart attribute ${key}`);
    }
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null && saved.has(key)) {
      throw new Error(`Shopify did not remove cart attribute ${key}`);
    }
  }
}
