import { CartForm, useOptimisticCart } from "@shopify/hydrogen";
import { useRef } from "react";
import { useFetchers } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";

/**
 * Hydrogen's optimistic cart, dropped once the server has already applied it.
 *
 * `useOptimisticCart` lays every cart fetcher that still carries `formData`
 * over the cart it is given, and React Router keeps `formData` through both
 * `submitting` and `loading` — so the overlay outlives the action that
 * produced it. The cart itself reaches the drawer as a deferred promise, and a
 * revalidated one can resolve while the fetcher is still in `loading`: the
 * line is then counted twice, once by the server and once by the overlay. A
 * quantity of 1 reads as 2 until the fetcher finally goes idle.
 *
 * The overlay is worth keeping only while the cart in hand predates the
 * mutation. That is what this checks, and it drops the overlay wholesale when
 * it cannot: the figures Hydrogen computed are inside a `structuredClone` it
 * owns, so there is no way to take one fetcher's contribution back out without
 * reimplementing its matching rules.
 *
 * The cost is a brief undercount when two cart fetchers overlap — one's
 * landing invalidates the other's overlay early. It corrects itself the moment
 * that one lands too, and showing one too few for an instant is a smaller lie
 * than showing one too many.
 */
export function useSettledOptimisticCart(
  originalCart: CartApiQueryFragment | null,
) {
  // Unconditionally: hooks cannot be skipped, so the overlay is always built
  // and only the decision to use it varies.
  const optimisticCart = useOptimisticCart<CartApiQueryFragment>(originalCart);
  const fetchers = useFetchers();
  const baselines = useRef(new Map<string, string>());

  const stale = settlementStale(baselines.current, fetchers, originalCart);

  return stale ? (originalCart as typeof optimisticCart) : optimisticCart;
}

/**
 * One transition of the per-fetcher baselines against the cart now on screen.
 *
 * Takes the baselines as an argument — and writes to them — so scripted event
 * sequences can drive it in tests the way the hook's ref does across renders.
 */
export function settlementStale(
  baselines: Map<string, string>,
  fetchers: Array<{
    key: string;
    state: "submitting" | "loading" | "idle";
    formData?: FormData | null;
  }>,
  cart: CartApiQueryFragment | null,
): boolean {
  const fingerprint = cartFingerprint(cart);
  const live = new Set<string>();
  let stale = false;

  for (const fetcher of fetchers) {
    if (!(fetcher.formData && isCartMutation(fetcher.formData))) {
      continue;
    }
    live.add(fetcher.key);

    if (fetcher.state === "submitting") {
      // React Router revalidates loaders only once the action has returned,
      // so a cart read during `submitting` cannot contain this submission.
      // That makes the baseline sound by invariant rather than by whatever
      // moment this happened to render on.
      //
      // Re-taken every time, not only on a key first seen: a keyed fetcher
      // submitted again before it goes idle — a double-tapped Add to cart, a
      // stepper keyed by line id — runs `loading` straight into `submitting`.
      // Keeping the first baseline would compare the second submission
      // against a cart the first one has already changed, and its overlay
      // would be dropped for the whole of its flight.
      baselines.set(fetcher.key, fingerprint);
      continue;
    }

    if (!baselines.has(fetcher.key)) {
      // First seen mid-flight — the drawer mounts when it opens, which may be
      // after the action already returned. Nothing here establishes that the
      // cart predates the mutation, so the overlay cannot be trusted.
      stale = true;
      continue;
    }

    if (baselines.get(fetcher.key) !== fingerprint) {
      stale = true;
    }
  }

  for (const key of [...baselines.keys()]) {
    if (!live.has(key)) {
      baselines.delete(key);
    }
  }

  return stale;
}

const CART_MUTATIONS = new Set<string>([
  CartForm.ACTIONS.LinesAdd,
  CartForm.ACTIONS.LinesRemove,
  CartForm.ACTIONS.LinesUpdate,
]);

function isCartMutation(formData: FormData) {
  try {
    const { action } = CartForm.getFormInput(formData);
    return typeof action === "string" && CART_MUTATIONS.has(action);
  } catch {
    // A fetcher submitting something that is not a cart form at all.
    return false;
  }
}

/**
 * What the server's cart holds, as one comparable string.
 *
 * `updatedAt` looks like the obvious marker and is not: Shopify's `DateTime`
 * is second-resolution, so a removal and the add that follows it land on the
 * same stamp — exactly the sequence that shows this bug. Line quantities move
 * whenever the cart does, whatever the clock says.
 */
function cartFingerprint(cart: CartApiQueryFragment | null) {
  const lines = cart?.lines?.nodes ?? [];
  return lines
    .map((line) => `${line.merchandise?.id ?? line.id}:${line.quantity}`)
    .sort()
    .join("|");
}
