import { useFetcher, useFetchers } from "react-router";

/**
 * Removing a cart line, and keeping its request alive after the line is gone.
 *
 * The trash button lives inside the line it removes, and `useOptimisticCart`
 * splices that line out the moment the request goes out — so the form, and the
 * fetcher it submitted through, leave the DOM while the request is still in
 * flight. A fetcher nobody holds is cleaned up with its revalidation, and the
 * cart on screen is then the one from before the removal.
 *
 * This used to be covered by giving every trash button the same fetcher key
 * and holding that one key somewhere that stays mounted. One key for the whole
 * cart meant two removals were the same fetcher, though: the second press
 * replaced the first's pending revalidation, the server cart stayed as it was
 * before either, and the line removed first flashed back in. Each line gets
 * its own key here, and `LineRemoveFetchers` holds one per line of the cart
 * *the server knows about* — so a hold outlives the optimistic splice, and
 * outlives the last line going, which empties the cart and unmounts its detail
 * view with it.
 */
const PREFIX = "cart-line-remove-";

export function lineRemoveFetcherKey(lineId: string): string {
  return `${PREFIX}${lineId}`;
}

/** True while any line removal is in flight. */
export function useLineRemovePending(): boolean {
  let fetchers = useFetchers();
  return fetchers.some((f) => f.state !== "idle" && f.key?.startsWith(PREFIX));
}

function HoldLineRemoveFetcher({ lineId }: { lineId: string }) {
  // Registering the key is the whole job: it keeps the router's fetcher — and
  // the revalidation it will trigger — alive past the line's own unmount.
  useFetcher({ key: lineRemoveFetcherKey(lineId) });
  return null;
}

/**
 * One holder per line of the server's cart. Render from somewhere that stays
 * mounted for as long as the cart is open.
 */
export function LineRemoveFetchers({ lineIds }: { lineIds: string[] }) {
  return (
    <>
      {lineIds.map((id) => (
        <HoldLineRemoveFetcher key={id} lineId={id} />
      ))}
    </>
  );
}
