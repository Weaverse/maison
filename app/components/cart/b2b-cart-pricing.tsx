import { useOptimisticCart } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { useSelectedLocale } from "~/hooks/use-locale";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import {
  cartPricingIdentity,
  cartPricingKey,
  changedProducts,
  changedVariants,
  fetchDecision,
  incrementBreaches,
  isAnswerCurrent,
  normId,
  productDiscountRate,
  RETRY_DELAYS_MS,
  shouldCache,
} from "~/utils/b2bridge/headless";
import type {
  CartPricingResponse,
  CartPricingState,
  PricedCartLine,
} from "~/utils/b2bridge/types";

/**
 * B2Bridge prices for the cart, fetched once and read by every part of it.
 *
 * The request carries no cart: `/api/b2b-cart-pricing` reads the session's own
 * cart, so this only has to decide *when* to ask. That matters because the
 * rate limit is 20 requests a minute for the whole shop, shared with every
 * other B2Bridge endpoint — a cart that refetches on each `+` click would
 * exhaust it between two buyers.
 *
 * Three guards decide that, and each one stops a different burst:
 *
 * 1. The key comes from the *server's* cart, so a quantity Shopify has not
 *    accepted yet cannot be priced.
 * 2. Nothing is fetched while the optimistic cart disagrees with it. Clicking
 *    `+` four times walks the server cart through four states; waiting for it
 *    to stand still collapses them into one request instead of four.
 * 3. Answers are kept against their key for a short while, so going `+` then
 *    `−` back to a quantity already priced costs nothing. Remembering only the
 *    latest key would not do: that walk is `A → B → A`, and `A` is not `B`.
 */

/**
 * Long enough to absorb a spammed stepper, short enough not to be felt.
 *
 * Waiting for the cart to settle already collapses most of a burst, but the
 * two carts can agree for a render in the middle of one, and at 20 requests a
 * minute for the whole shop a few of those are expensive. Past roughly this
 * mark the delay stops buying protection and starts being a spinner the buyer
 * watches for no reason.
 */
const DEBOUNCE_MS = 250;

/**
 * How long a priced cart may be reused.
 *
 * Short on purpose. The merchant can change a price list at any moment and
 * B2Bridge publishes no webhook for it, so this is the window in which the
 * cart may show a price that has just moved. Checkout prices the cart again
 * server-side regardless, so a stale figure here can be shown but not charged.
 */
const CACHE_TTL_MS = 30_000;

/**
 * How long a click may sit marked before the cart has shown any sign of it.
 *
 * Longer than the stepper's own 300ms debounce, so an ordinary click keeps
 * its placeholder the whole way through; short enough that a click which
 * never reaches the cart does not leave one standing.
 */
const MARK_GRACE_MS = 800;

interface B2BPricingValue {
  /** `null` until the first response. */
  state: CartPricingState | null;
  loading: boolean;
  /**
   * The prices on screen answer an older cart than the one in the session.
   *
   * Truer than `loading` for deciding what to show the buyer: a quantity
   * change spends 400ms in the debounce before any request starts, and the
   * fetcher is idle through all of it while the figures are already wrong.
   */
  stale: boolean;
  /**
   * Bare product ids whose prices are being worked out.
   *
   * Per product rather than one flag for the cart, so a `+` on one product
   * does not set the whole cart spinning — and per product rather than per
   * variant, because a tier is reached on a product's combined quantity, so
   * moving one variant moves the prices of all of its siblings.
   */
  recalculating: Set<string>;
  /**
   * Mark a product as being worked out, from the moment the buyer touches it.
   *
   * `recalculating` is derived from the cart, and the cart does not change
   * until a stepper's debounce elapses and the request is in flight. It also
   * says nothing at all until a first answer exists to be out of date, so the
   * very first `+` on a product drew no placeholder while every later one
   * did. Calling this on the click closes both gaps: the figures go to a
   * placeholder on the click and stay there until the price that replaces
   * them is the final one, tier included.
   */
  markRecalculating: (productId: string | null) => void;
  /**
   * Variant and product ids → the name to show in a limit message.
   *
   * Taken from the cart rather than from B2Bridge: the API's own `message` is
   * English only, while the cart already holds every title in the locale the
   * buyer is reading.
   */
  names: Record<string, string>;
  /**
   * Cart line id → bare variant id, for the hooks that price one line.
   *
   * Comes from the cart, never from `state`. See `cartLineVariants`.
   */
  lineVariants: Map<string, string>;
  /**
   * Who is being priced, where, and what they hold — the optimistic cart, so
   * it changes the moment the buyer touches it.
   *
   * An invoice belongs to the cart it was raised for. Anything holding on to
   * a checkout result compares this against the value it had when the result
   * arrived, and drops it when they differ.
   */
  cartKey: string;
}

const EMPTY_SET: Set<string> = new Set();
const EMPTY_LINE_VARIANTS = new Map<string, string>();

const B2BPricingContext = createContext<B2BPricingValue>({
  state: null,
  loading: false,
  stale: false,
  recalculating: EMPTY_SET,
  markRecalculating: () => {
    /* no provider, nothing to mark */
  },
  names: {},
  lineVariants: EMPTY_LINE_VARIANTS,
  cartKey: "",
});

/** The cart as the server knows it, reduced to what changes a price. */
function cartNames(cart: CartApiQueryFragment | null): Record<string, string> {
  const names: Record<string, string> = {};
  for (const node of cart?.lines?.nodes ?? []) {
    const variant = node.merchandise;
    if (!variant?.id) {
      continue;
    }
    const product = variant.product?.title ?? "";
    const label =
      variant.title && variant.title !== "Default Title"
        ? `${product} - ${variant.title}`
        : product;
    names[normId(variant.id)] = label;
    if (variant.product?.id) {
      names[normId(variant.product.id)] = product;
    }
  }
  return names;
}

/** Bare variant id → the bare product id it belongs to. */
/**
 * Cart line id → bare variant id, taken from the cart rather than from the
 * pricing answer.
 *
 * `CartPricingState` carries a map of its own, built server-side from the cart
 * it priced. Reading that one put stale line ids in front of the buyer: the
 * cache is keyed by variant and quantity only, so an answer computed for one
 * cart is reused for any later cart holding the same quantities — and if those
 * quantities now sit on different line ids, every per-line lookup misses. The
 * line then falls back to Shopify's retail price while the summary keeps
 * showing B2Bridge's subtotal, which is two prices for one cart.
 *
 * Which line holds which variant is a fact about the cart on screen, not about
 * the answer, so it is read from the cart every render and cannot go stale.
 */
function cartLineVariants(
  cart: CartApiQueryFragment | null,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of cart?.lines?.nodes ?? []) {
    const variantId = node.merchandise?.id;
    if (node.id && variantId) {
      map.set(node.id, normId(variantId));
    }
  }
  return map;
}

function cartVariantProducts(
  cart: CartApiQueryFragment | null,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of cart?.lines?.nodes ?? []) {
    const variantId = node.merchandise?.id;
    const productId = node.merchandise?.product?.id;
    if (variantId && productId) {
      map.set(normId(variantId), normId(productId));
    }
  }
  return map;
}

/** Variant → product, for the lines the last answer priced. */
function pricedVariantProducts(
  state: CartPricingState | null,
): Map<string, string> {
  const map = new Map<string, string>();
  if (state?.status === "priced") {
    for (const line of state.lines) {
      map.set(normId(line.variantId), normId(line.productId));
    }
  }
  return map;
}

/**
 * Who is being priced and where, ahead of what is in their cart.
 *
 * The cache and in-flight key live in module scope and are shared by every
 * mounted provider, so a key of lines alone made
 * two different buyers — or the same buyer in two markets — look like one
 * request. Changing country through the selector keeps the quantities, which
 * meant the cache answered with the previous market's prices and currency and
 * never asked about the new one.
 *
 * `path` carries the locale prefix, and the locale is what the server resolves
 * the market from, so it is the same signal the answer was computed under.
 */
/**
 * Dedupe state lives in the module, not in a ref.
 *
 * More than one provider can be mounted at once — the drawer wraps one while
 * the product page's variant list wraps another — and per-component refs would
 * let each of them spend its own request on the same cart. There is one cart
 * per tab, so module scope is the scope this belongs in.
 */
const priceCache = new Map<string, { state: CartPricingState; at: number }>();
let inFlightKey: string | null = null;

const B2BPricingPresent = createContext(false);

/**
 * Supplies the cart's B2Bridge prices to everything below it.
 *
 * Nests harmlessly: the cart drawer wraps the free-shipping bar *and* the cart
 * together, while `Cart` wraps itself for the cart page, so on the drawer both
 * are mounted. The inner one steps aside rather than opening a second request
 * for the same cart — at 20 requests a minute, a duplicate is expensive.
 */
export function B2BPricingProvider(props: {
  cart: CartApiQueryFragment | null;
  children: React.ReactNode;
}) {
  const nested = useContext(B2BPricingPresent);
  if (nested) {
    return props.children;
  }
  return <B2BPricingRoot {...props} />;
}

function B2BPricingRoot({
  cart,
  children,
}: {
  /** The server's cart. The optimistic one is derived here. */
  cart: CartApiQueryFragment | null;
  children: React.ReactNode;
}) {
  // Derived here rather than taken as a prop: every mount point needs it, and
  // one that passed the server cart twice would silently lose both the guard
  // against pricing a cart Shopify has not accepted and the instant feedback
  // below.
  const optimisticCart = useOptimisticCart<CartApiQueryFragment>(cart);
  const fetcher = useFetcher<CartPricingResponse>({ key: "b2b-cart-pricing" });
  const path = usePrefixPathWithLocale("/api/b2b-cart-pricing");
  const [state, setState] = useState<CartPricingState | null>(null);

  const identity = cartPricingIdentity(cart, path);
  const key = cartPricingKey(cart, identity);
  // The optimistic cart is what the buyer just acted on, so it is what the
  // spinners must answer to. A pending `+` leaves the two disagreeing until
  // Shopify catches up.
  const optimisticKey = cartPricingKey(optimisticCart, identity);
  const settled = key === optimisticKey;

  // A changed identity does not make the answer on screen stale, it makes it
  // somebody else's. Dropping it puts the gate back to `pending`, so nothing
  // is shown or checked out at the previous market's prices while the new
  // ones are being worked out.
  const seenIdentity = useRef(identity);
  useEffect(() => {
    if (seenIdentity.current === identity) {
      return;
    }
    seenIdentity.current = identity;
    setState(null);
    setAnsweredKey(null);
  }, [identity]);

  const retries = useRef(0);
  /**
   * Products the buyer has just touched, marked on the click itself.
   *
   * Held here rather than in the stepper because a tier is reached on a
   * product's combined quantity: a `+` on one variant moves the price of
   * every row in its table, including the ones still at zero.
   */
  const [marked, setMarked] = useState<Set<string>>(EMPTY_SET);
  const markRecalculating = useCallback((productId: string | null) => {
    if (!productId) {
      return;
    }
    const id = normId(productId);
    setMarked((current) => {
      if (current.has(id)) {
        return current;
      }
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);
  /** The cart key the current `state` was computed for. */
  const [answeredKey, setAnsweredKey] = useState<string | null>(null);
  // A cart edit renders before the next pricing response arrives. Keep the
  // current key available to the response effect without rerunning that effect
  // against fetcher.data from the previous cart.
  const currentKey = useRef(key);
  currentKey.current = key;
  // `fetcher.load` is a fresh function on every render; holding it in a ref
  // keeps it out of the effect's dependencies.
  const load = useRef(fetcher.load);
  load.current = fetcher.load;

  useEffect(() => {
    const cached = priceCache.get(key) ?? null;
    const decision = fetchDecision({
      key,
      settled,
      inFlight: inFlightKey,
      cachedAt: cached?.at ?? null,
      now: Date.now(),
      ttlMs: CACHE_TTL_MS,
    });

    if (decision === "idle") {
      setState(null);
      setAnsweredKey(null);
      return;
    }
    if (decision === "wait") {
      return;
    }
    if (decision === "use-cache") {
      setState(cached.state);
      setAnsweredKey(key);
      return;
    }

    const timer = setTimeout(() => {
      inFlightKey = key;
      load.current(path);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key, settled, path]);

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }
    const answered = fetcher.data.pricedFor;
    // A response may describe a different server cart than the one this
    // fetch started for. Never leave that request marked in flight forever.
    inFlightKey = null;
    if (!answered) {
      return;
    }
    // Worth keeping even when it is no longer wanted: the buyer may well come
    // back to that quantity, and then it costs nothing.
    if (shouldCache(fetcher.data)) {
      priceCache.set(answered, { state: fetcher.data, at: Date.now() });
    }
    if (!isAnswerCurrent(answered, currentKey.current)) {
      return;
    }
    setState(fetcher.data);
    setAnsweredKey(answered);
  }, [fetcher.data]);

  // A failure that said it was worth retrying gets a couple of attempts on a
  // widening delay. Without this a single rate-limited call leaves the cart
  // showing "unavailable" until the buyer happens to change something, which
  // reads as the integration being broken rather than busy.
  useEffect(() => {
    if (state?.status !== "unavailable" || !state.retryable) {
      retries.current = 0;
      return;
    }
    const delay = RETRY_DELAYS_MS[retries.current];
    if (delay === undefined) {
      return;
    }
    const timer = setTimeout(() => {
      retries.current += 1;
      inFlightKey = key;
      load.current(path);
    }, delay);
    return () => clearTimeout(timer);
  }, [state, key, path]);

  // An invoice was raised and nobody has told us whether it was paid. Asking
  // once per answer that reports one is enough: the route is cheap when there
  // is nothing to settle, and it clears the record as soon as there is.
  const settle = useFetcher<{ settled: boolean }>({ key: "b2b-settle" });
  const settlePath = usePrefixPathWithLocale("/api/b2b-settle");
  const asked = useRef<string | null>(null);

  useEffect(() => {
    if (!state?.pendingDraft || settle.state !== "idle") {
      return;
    }
    // Once per cart. Settling changes the cart, which brings a new key here,
    // and without this the two would chase each other.
    if (asked.current === key) {
      return;
    }
    asked.current = key;
    settle.submit(null, { method: "post", action: settlePath });
  }, [state?.pendingDraft, key, settlePath, settle.state, settle.submit]);

  // Both sources: the cart as it stands, and the answer on screen, so a
  // variant just removed still names the product it left.
  const variantProducts = new Map([
    ...pricedVariantProducts(state),
    ...cartVariantProducts(optimisticCart),
  ]);

  const outOfDate = Boolean(key) && (!settled || key !== answeredKey);
  const changed = changedVariants(answeredKey, optimisticKey);
  const derivedProducts = (() => {
    // Nothing priced yet: the buyer is looking at Shopify's prices, not at
    // stale B2B ones, so there is nothing to announce.
    if (!outOfDate || state?.status !== "priced") {
      return EMPTY_SET;
    }
    // Out of date, but with no answer to compare against there is no way to
    // say which product moved — a provider mounted mid-session, such as the
    // drawer's, starts here. Marking everything is noisier than it needs to
    // be and still truthful; marking nothing would leave the buyer with no
    // sign that anything is happening at all.
    if (changed.size === 0) {
      return new Set(variantProducts.values());
    }
    return changedProducts(changed, variantProducts);
  })();
  // What the cart says, plus what the buyer has just done to it.
  const pendingProducts =
    marked.size === 0
      ? derivedProducts
      : new Set([...derivedProducts, ...marked]);

  // A mark is held until the answer that replaces it arrives, and no longer.
  //
  // `outOfDate` is false for the beat between the click and the request going
  // out, and false again once the answer lands, so the two have to be told
  // apart: having been out of date and come back means the figures on screen
  // are the new ones. A click that never reaches the cart — a `+` and a `-`
  // that cancel out, say — never makes it out of date at all, and the grace
  // period is what keeps that from leaving a placeholder up for good.
  const sawOutOfDate = useRef(false);
  useEffect(() => {
    if (marked.size === 0) {
      sawOutOfDate.current = false;
      return;
    }
    if (outOfDate) {
      sawOutOfDate.current = true;
      return;
    }
    if (sawOutOfDate.current) {
      sawOutOfDate.current = false;
      setMarked(EMPTY_SET);
      return;
    }
    const timer = setTimeout(() => setMarked(EMPTY_SET), MARK_GRACE_MS);
    return () => clearTimeout(timer);
  }, [marked, outOfDate]);

  return (
    <B2BPricingPresent.Provider value={true}>
      <B2BPricingContext.Provider
        value={{
          state,
          loading: fetcher.state !== "idle",
          // `!settled` is what makes this true the moment a stepper is
          // clicked. Waiting for the server cart to come back first leaves a
          // beat of silence after the click that reads as nothing happening.
          stale: outOfDate,
          recalculating: pendingProducts,
          markRecalculating,
          names: cartNames(cart),
          // Both carts, optimistic last: the lines on screen come from the
          // optimistic cart, so its ids are the ones looked up, while the
          // server's keep a line that is mid-removal resolvable.
          lineVariants: new Map([
            ...cartLineVariants(cart),
            ...cartLineVariants(optimisticCart),
          ]),
          cartKey: optimisticKey,
        }}
      >
        {children}
      </B2BPricingContext.Provider>
    </B2BPricingPresent.Provider>
  );
}

export function useB2BPricing(): B2BPricingValue {
  return useContext(B2BPricingContext);
}

/**
 * The B2B price for one cart line, or `null` when B2Bridge is not pricing it.
 *
 * Several cart lines can share one priced line — the same variant ordered with
 * different engraving is two lines in Shopify and one line here — so the unit
 * price is shared while each cart line keeps its own quantity.
 *
 * A line with no rule is still returned. B2Bridge sets its `unitPrice` to
 * Shopify's own price in that case, so using it keeps one arithmetic across a
 * mixed cart; `hasRule` is there for callers that need to tell the two apart,
 * such as deciding whether a strikethrough means anything.
 */
export function useB2BLinePrice(lineId: string): PricedCartLine | null {
  const { state, lineVariants } = useB2BPricing();
  if (state?.status !== "priced" || !lineId) {
    return null;
  }
  const variantId = lineVariants.get(lineId);
  if (!variantId) {
    return null;
  }
  return state.lines.find((entry) => entry.variantId === variantId) ?? null;
}

/**
 * What a subset of the cart comes to at B2B prices.
 *
 * The product page's variant list totals only the lines of the product being
 * viewed, so it cannot use the cart-wide `subtotal`. Returns `null` unless
 * every line asked about is priced, because a total that silently mixes B2B
 * and Shopify figures is worse than one the caller knows it cannot show.
 */
export function useB2BLinesTotal(
  lines: { id: string; quantity: number }[],
): { amount: number; currency: string } | null {
  const { state, lineVariants } = useB2BPricing();
  if (state?.status !== "priced") {
    return null;
  }
  let amount = 0;
  for (const line of lines) {
    const variantId = lineVariants.get(line.id);
    const priced = variantId
      ? state.lines.find((entry) => entry.variantId === variantId)
      : null;
    if (!priced) {
      return null;
    }
    amount += priced.unitPrice * line.quantity;
  }
  return { amount, currency: state.currency };
}

export interface CheckoutGate {
  blocked: boolean;
  /**
   * `pending` — nothing has come back yet, so it is not yet known whether
   * this buyer is priced by B2Bridge at all. Nothing is wrong; the cart
   * simply cannot say that Shopify's price is the right one.
   * `limits` — the cart breaks an order rule and the buyer can fix it.
   * `unavailable` — B2Bridge could not price the cart, so no price is
   * trustworthy and Shopify's own must not be charged instead.
   */
  reason: "pending" | "limits" | "unavailable" | null;
}

/** Whether the buyer may proceed to checkout, and why not. */
export function useCheckoutGate(): CheckoutGate {
  const { state } = useB2BPricing();
  // No answer yet — the first render, the 250ms debounce, the request itself.
  // A wholesale buyer and a retail one look identical here, and the fallthrough
  // below treats that as "not a B2B cart", which put Shopify's checkout link on
  // screen at retail prices before pricing had been asked for. Shut until the
  // server says positively that B2Bridge does not price this cart.
  if (!state) {
    return { blocked: true, reason: "pending" };
  }
  if (state?.status === "unavailable") {
    return { blocked: true, reason: "unavailable" };
  }
  if (state?.status === "priced" && !state.canCheckout) {
    return { blocked: true, reason: "limits" };
  }
  // `canCheckout` does not cover the increment — B2Bridge reports one per line
  // and then accepts any quantity against it, so the only thing standing
  // between a cart of 12 and a draft order the merchant's rule forbids is this
  // check and the matching one in `createCheckout`. Both are needed: this one
  // so the button is disabled rather than failing on click, that one because a
  // disabled button is not a rule.
  if (state?.status === "priced" && incrementBreaches(state.lines).length > 0) {
    return { blocked: true, reason: "limits" };
  }
  return { blocked: false, reason: null };
}

/**
 * The cart's order-limit violations, in the buyer's own language.
 *
 * B2Bridge sends a ready-made `message`, but only in English. The structured
 * fields beside it carry everything needed to say the same thing from the
 * catalogue, so that is what is shown — and the API's sentence stays as the
 * fallback for a shape this does not recognise, which is better than an empty
 * line and makes a new `code` visible rather than silent.
 */
export function useLimitMessages(): string[] {
  const { t } = useTranslation();
  const { state, names } = useB2BPricing();
  const locale = useSelectedLocale();

  if (state?.status !== "priced") {
    return [];
  }

  const messages = state.errors.map((error) => {
    const id = error.variantId ?? error.productId;
    const name =
      (id ? names[normId(id)] : null) ||
      (error.scope === "PRICE_LIST" ? t("cart.b2bLimitOrder") : null);
    const below = error.code === "BELOW_MINIMUM";
    const value = below ? error.minimum : error.maximum;
    if (!name || value == null) {
      return error.message;
    }

    const byQuantity = error.limitBy === "QUANTITY";
    const limit = byQuantity
      ? String(value)
      : new Intl.NumberFormat(
          `${locale.language.toLowerCase()}-${locale.country}`,
          { style: "currency", currency: state.currency },
        ).format(value);

    if (below) {
      return t(
        byQuantity ? "cart.b2bLimitMinQuantity" : "cart.b2bLimitMinAmount",
        { name, limit },
      );
    }
    return t(
      byQuantity ? "cart.b2bLimitMaxQuantity" : "cart.b2bLimitMaxAmount",
      { name, limit },
    );
  });

  // Appended rather than merged into `errors`: these are this storefront's
  // own finding, not something B2Bridge reported, and naming the quantity to
  // change to is the whole point — the buyer cannot act on "multiples of 5"
  // without being told which of their lines is wrong.
  for (const breach of incrementBreaches(state.lines)) {
    const name = names[breach.variantId];
    if (!name) {
      continue;
    }
    messages.push(
      t("cart.b2bLimitIncrement", {
        name,
        increment: String(breach.increment),
        quantity: String(breach.quantity),
        allowed: String(breach.allowed),
      }),
    );
  }

  return messages;
}

/**
 * Whether this product's prices are being worked out right now.
 *
 * Asked per product, so every variant of it answers the same — which is what
 * the pricing actually does.
 */
export function useProductRecalculating(productId: string | null): boolean {
  const { recalculating } = useB2BPricing();
  return productId ? recalculating.has(normId(productId)) : false;
}

/**
 * The rate this product's variants are currently discounted by, or `null`.
 *
 * Lets a variant nobody has added yet show the price it would be sold at
 * instead of its list price, which otherwise reads as "this one is excluded"
 * beside a sibling that is plainly discounted.
 */
export function useB2BProductRate(productId: string | null): number | null {
  const { state } = useB2BPricing();
  if (!productId || state?.status !== "priced") {
    return null;
  }
  return productDiscountRate(state.lines, normId(productId));
}
