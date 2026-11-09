import { useParentInstance } from "@weaverse/hydrogen";
import { useSyncExternalStore } from "react";

/** Stable no-ops, so a missing parent does not change the hook's inputs. */
const NEVER_UPDATES = () => () => {
  /* nothing to unsubscribe from */
};
const NO_DATA = () => undefined;

/**
 * The parent section's serialized state, re-read whenever the Studio changes it.
 *
 * `useParentInstance` hands back the store itself, and reading `.data` off it
 * is a snapshot taken once. A child item is memoised on its own instance, so a
 * setting the merchant drags on the parent updates the parent alone — the
 * child goes on showing what it first rendered until the page is reloaded.
 * Subscribing is what closes that: the store replaces its state object on
 * every update rather than mutating it, so each snapshot is a new reference
 * and React re-renders the child with it.
 */
export function useParentData<T>(): T | undefined {
  const parent = useParentInstance();
  const subscribe = parent?.subscribe ?? NEVER_UPDATES;
  const snapshot = parent?.getSnapShot ?? NO_DATA;
  return useSyncExternalStore(subscribe, snapshot, snapshot) as T | undefined;
}
