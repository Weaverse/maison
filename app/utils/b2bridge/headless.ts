import type {
  CartLineForPricing,
  CartPricing,
  Failure,
  HeadlessRequest,
} from "./types";

/**
 * The pure half of the B2Bridge Headless Cart & Checkout integration.
 *
 * Everything here is free of Hydrogen, the network and the environment, for
 * two reasons: `scripts/b2bridge-probe.mjs` can only bundle modules that are,
 * and the rules encoded below are the ones that must never be got wrong, so
 * they are the ones worth testing directly.
 *
 * The policy this module serves is the opposite of `client.server.ts`. That
 * file prices the product page and degrades to Shopify's own price whenever
 * B2Bridge cannot answer. These endpoints decide what the buyer is actually
 * charged, so a failure here blocks checkout and never falls back — showing
 * one price and charging another is worse than showing none.
 */

/** Both endpoints reject a cart outside these bounds with `INVALID_REQUEST`. */
export const MAX_LINES = 250;
export const MAX_QUANTITY = 1_000_000;

/**
 * `gid://shopify/ProductVariant/47591719436510` → `47591719436510`.
 *
 * Both forms are accepted on the way in, and the response comes back in GID
 * form whichever was sent — verified against the dev store on 2026-10-13 — so
 * ids are reduced to one form before they are compared or used as map keys.
 *
 * Unlike `customerIdFromGid` in `buyer.ts`, this does not check what kind of
 * object the GID names: it is used on ids whose type is already known from
 * where they came from.
 */
export function normId(id: string): string {
  const slash = id.lastIndexOf("/");
  return slash === -1 ? id : id.slice(slash + 1);
}

export interface MergedLines {
  lines: HeadlessRequest["lines"];
  /** Bare variant id → the cart line ids that were merged into it. */
  sources: Map<string, string[]>;
}

/**
 * Collapses a Shopify cart down to the one-line-per-variant shape B2Bridge
 * requires.
 *
 * Shopify splits a cart line by more than its variant — line attributes,
 * selling plans and bundle apps all produce a second line for the same
 * variant, so "20 engraved SALES, 30 engraved KHO VẬN" is two lines of one
 * variant. B2Bridge rejects that outright with `INVALID_REQUEST`, which makes
 * this a failure that depends on what the buyer put in their cart rather than
 * on any code path, and so will not show up in testing unless it is looked for.
 *
 * Merging is not only about avoiding the 400. Volume tiers are evaluated on the
 * merged quantity, so sending the two lines separately — if it were allowed —
 * would price 20 and 30 at their own tiers instead of 50 at the tier the
 * merchant configured.
 *
 * `sources` is what makes the response usable again: one priced line maps back
 * to several cart lines, each of which shows the same `unitPrice` but its own
 * subtotal, and a `VARIANT`-scoped error belongs to the group rather than to
 * any one of them.
 */
export function mergeLines(cartLines: CartLineForPricing[]): MergedLines {
  const quantities = new Map<string, number>();
  const sources = new Map<string, string[]>();

  for (const line of cartLines) {
    // Shopify drops a line at zero, so a non-positive quantity here is a bug
    // upstream. Sending it on would fail the whole cart with INVALID_REQUEST.
    if (line.quantity < 1) {
      continue;
    }
    const variantId = normId(line.variantId);
    quantities.set(variantId, (quantities.get(variantId) ?? 0) + line.quantity);
    sources.set(variantId, [...(sources.get(variantId) ?? []), line.id]);
  }

  return {
    lines: [...quantities].map(([variantId, quantity]) => ({
      variantId,
      quantity,
    })),
    sources,
  };
}

/**
 * A stable identity for one pricing request.
 *
 * The rate limit is 20 requests per 60 seconds per shop *and source IP*, shared
 * with every other B2Bridge public endpoint, so the storefront has to stop
 * asking the same question twice. Two requests with the same key are known to
 * have the same answer and the second one is skipped.
 *
 * Every input that can change the price is in the key. `market` is included
 * even though the epic's own list leaves it out: a rule can be scoped to
 * specific markets — rule 8985 on the dev store is scoped to CA — so a buyer
 * switching country changes the price while the cart does not.
 *
 * Lines are sorted because removing an item and adding it back produces the
 * same cart in a different order, and ids are normalised because Shopify hands
 * out GIDs in some places and bare ids in others.
 */
export function pricingKey(request: HeadlessRequest): string {
  const lines = request.lines
    .map((line) => `${normId(line.variantId)}:${line.quantity}`)
    .sort()
    .join(",");

  return [
    request.domain,
    normId(request.customerId),
    request.companyLocationId ? normId(request.companyLocationId) : "-",
    request.market
      ? `${normId(request.market.id)}/${request.market.countryCode}`
      : "-",
    lines,
  ].join("|");
}

/**
 * The only reliable way to tell a result from a failure.
 *
 * HTTP status cannot carry this. A wrong key, a missing key, a missing
 * `domain`, an unknown shop and a plan below Advanced all answer **HTTP 200**
 * with nothing but `{"message": "..."}`. Verified against the live endpoint on
 * 2026-10-13: a bad key on `cart-pricing` returned `200` and
 * `{"message":"Access key is not correct"}`.
 *
 * So `res.ok` is not a gate — this is. Anything without `success: true` is a
 * failure, whatever the status said.
 */
export function isSuccess<T extends { success: true } = CartPricing>(
  body: unknown,
): body is T {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as { success?: unknown }).success === true
  );
}

/**
 * What to do about a response that did not pass `isSuccess`.
 *
 * `status` is still read here, just not as the success gate: a rate limit is
 * the one failure the API gives no `code` for, so `429` is only recognisable
 * by its status. Pass `0` when the request failed before an answer arrived.
 *
 * Note what is *not* here: a cart that breaks an order limit. That comes back
 * as `success: true` with `canCheckout: false`, and belongs in the cart UI
 * rather than in this taxonomy. Only `checkout` turns it into a failure, as
 * `422 ORDER_LIMIT_VIOLATION`, because by then there is nothing to render.
 */
export function classifyFailure(status: number, body: unknown): Failure {
  const payload = (body ?? {}) as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  const code = typeof payload.code === "string" ? payload.code : null;
  const message =
    typeof payload.message === "string"
      ? payload.message
      : "unexpected B2Bridge response";

  const failure: Failure = { action: "BLOCK", code, status, message };
  if (payload.details !== undefined) {
    failure.details = payload.details;
  }

  if (status === 429) {
    return { ...failure, action: "RETRY_BACKOFF" };
  }
  if (status >= 500 || status === 0) {
    return { ...failure, action: "RETRY_LATER" };
  }
  switch (code) {
    case "ORDER_LIMIT_VIOLATION":
      return { ...failure, action: "SHOW_ERRORS" };
    case "VARIANT_NOT_FOUND":
      return { ...failure, action: "DROP_LINES" };
    case "INVALID_REQUEST":
      // Ours to fix: a duplicate variant, a bad id, a quantity out of range.
      return { ...failure, action: "FIX_REQUEST" };
    default:
      // PLAN_INACTIVE, COMPANY_LOCATION_NOT_ALLOWED, CUSTOMER_NOT_FOUND,
      // DRAFT_ORDER_REJECTED, and the gateway's own auth replies.
      return failure;
  }
}

export type FetchDecision = "idle" | "wait" | "use-cache" | "fetch";

export interface FetchDecisionInput {
  /** The cart's pricing key, empty when the cart is empty. */
  key: string;
  /** Whether the server's cart and the optimistic cart agree. */
  settled: boolean;
  /** The key a request is already out for, if any. */
  inFlight: string | null;
  /** When this key was last answered, if it was. */
  cachedAt: number | null;
  now: number;
  ttlMs: number;
}

/**
 * Whether the cart needs a new price, and why not when it does not.
 *
 * Pulled out of the React effect that calls it so the rate-limit behaviour can
 * be tested rather than reasoned about. The walk this exists to get right is
 * `+` then `−`: the cart's key goes `A → B → A`, so a guard that remembers
 * only the previous key sees the second `A` as new and spends a request on a
 * cart it has already priced.
 */
export function fetchDecision(input: FetchDecisionInput): FetchDecision {
  if (!input.key) {
    return "idle";
  }
  // Mid-mutation: the quantity on screen is not the one Shopify holds.
  if (!input.settled) {
    return "wait";
  }
  if (input.inFlight === input.key) {
    return "wait";
  }
  if (input.cachedAt !== null && input.now - input.cachedAt < input.ttlMs) {
    return "use-cache";
  }
  return "fetch";
}

/**
 * Whether an answer is worth keeping against its cart key.
 *
 * Only a priced cart is. Caching a failure would hold the cart hostage to one
 * bad moment: a single rate-limited call would make that quantity look broken
 * for the whole TTL, and every return to it would replay the failure without
 * ever asking again. `not-applicable` is not cached either — it is cheap to
 * re-derive and usually means the buyer is not signed in yet, which is a
 * state that changes without the cart changing.
 */
export function shouldCache(state: { status: string } | null): boolean {
  return state?.status === "priced";
}

/** Delays between retries of a failure that said it was worth retrying. */
export const RETRY_DELAYS_MS = [2000, 6000];

/**
 * Which cart key the answer on screen belongs to.
 *
 * More than one provider can be mounted — the drawer and the product page's
 * variant list — and they share one request. Whichever of them handles the
 * response first clears the in-flight key, so the others find nothing there
 * and would never learn that their figures are current again. Falling back to
 * the last key answered lets every provider agree, in any order.
 */
export function answeredKeyFor(
  inFlight: string | null,
  lastAnswered: string | null,
): string | null {
  return inFlight ?? lastAnswered;
}

/**
 * Whether an answer that has just arrived still describes the cart on screen.
 *
 * Requests can be overtaken. Click `+` and the request goes out for the new
 * cart; click `−` before it lands and the buyer is back at a cart that is
 * already cached and already shown. The late answer then describes a cart they
 * have left, and applying it would both put the wrong prices on screen and
 * leave the view permanently marked as out of date — the key it was waiting
 * for never comes round again.
 */
export function isAnswerCurrent(
  answeredKey: string | null,
  currentKey: string,
): boolean {
  return answeredKey !== null && answeredKey === currentKey;
}

/**
 * The `variant:quantity` pairs in a cart key, as a map.
 *
 * The key is the one the provider identifies a cart by — a sorted
 * `variantId:quantity` list — not the five-part request key used for dedupe.
 */
function linesOfKey(key: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of key.split(",")) {
    const at = entry.lastIndexOf(":");
    if (at > 0) {
      map.set(entry.slice(0, at), Number(entry.slice(at + 1)));
    }
  }
  return map;
}

/**
 * Which variants the buyer has actually moved since the prices on screen were
 * worked out.
 *
 * One request prices the whole cart, so the simple reading is that every line
 * is out of date the moment any line changes — and every line then spins at
 * once for a single `+`, which looks like the page is reloading rather than
 * like one number being updated.
 *
 * The rule on the dev store applies its tiers per product (`EVERY_PRODUCT`),
 * so a quantity change reaches only its own line. A rule scoped across the
 * order could move a line this leaves quiet; that line still updates when the
 * answer lands, it simply does so without having announced itself first. A
 * spinner is a progress hint, not what keeps the price right.
 *
 * Only the lines are compared, because only the lines are in this key. A
 * change of market or buyer does not reach here; it changes the route the
 * request goes to, which remounts the pricing anyway.
 */
export function changedVariants(
  answeredKey: string | null,
  currentKey: string,
): Set<string> {
  // Nothing has been priced yet, so nothing is out of date: the buyer is
  // looking at Shopify's prices, not at stale B2B ones.
  if (answeredKey === null) {
    return new Set();
  }

  const after = linesOfKey(currentKey);
  const before = linesOfKey(answeredKey);
  const changed = new Set<string>();
  for (const [variantId, quantity] of after) {
    if (before.get(variantId) !== quantity) {
      changed.add(variantId);
    }
  }
  for (const variantId of before.keys()) {
    if (!after.has(variantId)) {
      changed.add(variantId);
    }
  }
  return changed;
}

/**
 * The products whose prices a set of moved variants reaches.
 *
 * Volume tiers are reached on a product's combined quantity, not on one
 * variant's, so moving a single variant reprices all of its siblings. Measured
 * on the dev store, 2026-10-14: variant 47591719436510 alone at quantity 6
 * prices at 325, and adding 6 of variant 47591720878302 — the same product —
 * takes it to 270.83 while the second line prices at 325 against a list price
 * of 390. Neither line was touched by the other's quantity in any way a buyer
 * would guess, so both have to announce that they are being worked out.
 *
 * Answering per product also covers the variants that are not in the cart at
 * all: the whole table for that product is being repriced, so the whole table
 * says so.
 *
 * Products stop there: a rule applying `EVERY_PRODUCT` reaches no further, so
 * the rest of the cart stays quiet.
 */
export function changedProducts(
  changed: Set<string>,
  variantProducts: Map<string, string>,
): Set<string> {
  const products = new Set<string>();
  for (const variantId of changed) {
    const productId = variantProducts.get(variantId);
    if (productId) {
      products.add(productId);
    }
  }
  return products;
}

/**
 * The discount rate a product is currently getting, as a fraction of list
 * price, or `null` when it is getting none.
 *
 * Measured on the dev store, 2026-10-14: B2Bridge works out one percentage
 * from the product's combined quantity and applies it to each variant's own
 * list price — a cart of 19 at 325 and 1 at 390 prices both lines at exactly
 * 30% off. So any priced line of a product reveals the rate for all of them,
 * including the variants sitting at zero that the buyer has not added yet.
 *
 * What this cannot do is predict the rate *after* an addition. Tiers are
 * reached in whole blocks, so adding a unit can move the rate for the whole
 * product. The figure is therefore the buyer's price at the quantities in the
 * cart right now, which is the same promise every other price in the table
 * makes.
 */
export function productDiscountRate(
  lines: { productId: string; unitPrice: number; originalUnitPrice: number }[],
  productId: string,
): number | null {
  for (const line of lines) {
    if (
      line.productId === productId &&
      line.originalUnitPrice > 0 &&
      line.unitPrice < line.originalUnitPrice
    ) {
      return 1 - line.unitPrice / line.originalUnitPrice;
    }
  }
  return null;
}

/**
 * A short, stable fingerprint of a pricing key.
 *
 * Used to recognise a cart the buyer has already started paying for without
 * carrying the whole key — which lists every variant and quantity — around in
 * a cookie.
 *
 * FNV-1a, because this only has to tell two carts apart, not resist anyone
 * trying to make them collide: the value it guards is the buyer's own invoice.
 */
export function fingerprint(key: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/**
 * How long a draft order is handed back instead of a new one being made.
 *
 * A duplicate guard, not a cache. Longer would start returning a buyer to an
 * invoice whose prices have since moved — the draft froze them when it was
 * created, and B2Bridge does not revisit it.
 */
export const CHECKOUT_REUSE_MS = 60_000;

export interface PaidLine {
  /** Bare variant id. */
  variantId: string;
  quantity: number;
}

export interface CartAdjustment {
  /** Cart lines to reduce, with the quantity they should be left at. */
  updates: { id: string; quantity: number }[];
  /** Cart lines to take out entirely. */
  removals: string[];
}

/**
 * What to take out of the cart once an order has been paid for.
 *
 * Subtracts rather than empties. Between creating the draft order and coming
 * back to pay it, a buyer can add more to their cart — those lines were never
 * invoiced, and clearing the cart wholesale would throw them away. Buying ten
 * and then adding four more leaves four, not nothing.
 *
 * A variant can sit on several cart lines at once (engraving, a selling plan),
 * so the paid quantity is taken off them in order until it is used up.
 */
export function adjustmentForPaidLines(
  cartLines: { id: string; variantId: string; quantity: number }[],
  paid: PaidLine[],
): CartAdjustment {
  const owed = new Map<string, number>();
  for (const line of paid) {
    const variantId = normId(line.variantId);
    owed.set(variantId, (owed.get(variantId) ?? 0) + line.quantity);
  }

  const updates: { id: string; quantity: number }[] = [];
  const removals: string[] = [];

  for (const line of cartLines) {
    const variantId = normId(line.variantId);
    const remaining = owed.get(variantId) ?? 0;
    if (remaining <= 0) {
      continue;
    }
    const taken = Math.min(remaining, line.quantity);
    owed.set(variantId, remaining - taken);

    const left = line.quantity - taken;
    if (left > 0) {
      updates.push({ id: line.id, quantity: left });
    } else {
      removals.push(line.id);
    }
  }

  return { updates, removals };
}

/**
 * A quantity that breaks the increment its rule sets.
 *
 * B2Bridge reports `increment` on every priced line and then accepts any
 * quantity regardless of it — measured against rule 8985 with
 * `increment_quantity = 5`, where quantities of 7 and 12 both came back
 * `canCheckout: true` with an empty `errors`, while a quantity below the
 * minimum on the same line is correctly refused. So the increment is the one
 * order limit this storefront has to hold on its own.
 */
export interface IncrementBreach {
  variantId: string;
  quantity: number;
  increment: number;
  /** The nearest allowed quantity, for the message and the input to snap to. */
  allowed: number;
}

/**
 * The nearest quantity the rule permits, at or below what was asked for.
 *
 * Rounds down rather than up: rounding up bills the buyer for units they did
 * not ask for, and the only case where down is not an option is a quantity
 * under the minimum, which this raises instead.
 *
 * Allowed quantities are the multiples of `increment` at or above `minimum`,
 * which is the model Shopify's own quantity rules use. A minimum that is not
 * itself a multiple rounds up to the first one that is, so a rule asking for
 * at least 7 in steps of 5 starts at 10.
 */
export function allowedQuantity(
  quantity: number,
  increment: number,
  minimum: number | null,
): number {
  const step = Math.max(1, Math.floor(increment) || 1);
  const floor = Math.max(
    step,
    Math.ceil(Math.max(1, minimum ?? 0) / step) * step,
  );
  if (quantity <= floor) {
    return floor;
  }
  return Math.max(floor, Math.floor(quantity / step) * step);
}

/**
 * Every priced line whose quantity is off its increment.
 *
 * Lines already under their minimum are left out: B2Bridge reports those as
 * `BELOW_MINIMUM` itself, and raising the quantity to the minimum is the fix
 * for both, so listing them twice would put two messages on one line.
 */
export function incrementBreaches(
  lines: {
    variantId: string;
    quantity: number;
    increment: number;
    minimum: number | null;
    hasRule: boolean;
  }[],
): IncrementBreach[] {
  const breaches: IncrementBreach[] = [];
  for (const line of lines) {
    const step = Math.max(1, Math.floor(line.increment) || 1);
    if (step <= 1 || !line.hasRule) {
      continue;
    }
    if (line.minimum != null && line.quantity < line.minimum) {
      continue;
    }
    if (line.quantity % step === 0) {
      continue;
    }
    breaches.push({
      variantId: normId(line.variantId),
      quantity: line.quantity,
      increment: step,
      allowed: allowedQuantity(line.quantity, step, line.minimum),
    });
  }
  return breaches;
}

export interface QuantityRule {
  minimum: number;
  maximum: number | null;
  increment: number;
}

/**
 * The two quantity rules on a cart line, combined into the one that binds.
 *
 * A line can be under both at once. Shopify's own B2B quantity rules arrive on
 * `merchandise.quantityRule` whenever the cart carries a `companyLocationId`
 * and a catalog sets them, and Shopify enforces those at checkout; B2Bridge's
 * arrive from `cart-pricing` and nothing enforces them. Preferring one source
 * discards a real constraint either way — a maximum set in Shopify admin would
 * go unmentioned by a stepper reading only B2Bridge, and the quantity would
 * then fail at a checkout the cart said was fine.
 *
 * Both have to hold, so each field takes the stricter side: the higher
 * minimum, the lower maximum, and for the increment the lowest common multiple,
 * since a quantity off either step breaks that rule. Two coprime increments
 * multiply out — 2 and 5 allow only multiples of 10 — which is a sign of a
 * misconfiguration rather than something to soften, and softening it would
 * mean quietly allowing quantities one of the two rules forbids.
 */
export function strictestRule(
  a: Partial<QuantityRule> | null | undefined,
  b: Partial<QuantityRule> | null | undefined,
): QuantityRule {
  const step = (value: number | null | undefined) =>
    Math.max(1, Math.floor(value || 0) || 1);
  const incA = step(a?.increment);
  const incB = step(b?.increment);

  let x = incA;
  let y = incB;
  while (y) {
    [x, y] = [y, x % y];
  }
  const increment = (incA / x) * incB;

  const maxA = a?.maximum && a.maximum > 0 ? a.maximum : null;
  const maxB = b?.maximum && b.maximum > 0 ? b.maximum : null;

  return {
    minimum: Math.max(1, a?.minimum || 1, b?.minimum || 1),
    maximum: maxA && maxB ? Math.min(maxA, maxB) : (maxA ?? maxB),
    increment,
  };
}
