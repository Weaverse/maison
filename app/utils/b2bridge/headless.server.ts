import {
  classifyFailure,
  isSuccess,
  MAX_LINES,
  MAX_QUANTITY,
} from "./headless";
import type {
  CartPricing,
  CheckoutResult,
  Failure,
  HeadlessRequest,
} from "./types";

/**
 * Server-only access to the B2Bridge Headless Cart & Checkout API.
 *
 * This is the authoritative price. Where `client.server.ts` may degrade to
 * Shopify's own price when B2Bridge cannot answer, nothing here may: the
 * numbers this file returns are what the buyer is charged, and the one
 * outcome worse than no price is the wrong one. Every failure path therefore
 * ends in a `Failure` the caller must act on, never in a silent fallback.
 *
 * Results are deliberately not cached. `client.server.ts` reads shop-level
 * records that are the same for every buyer and caches them for that reason;
 * these responses are specific to one buyer's cart, so a shared cache would be
 * a route for one buyer's negotiated prices to reach another.
 */

/**
 * The same host `client.server.ts` reads the Price List API from. Repeated
 * rather than shared so the two API generations stay independent — if it ever
 * moves, both copies move together.
 */
const B2BRIDGE_HOST = "https://b2bridge-public-api.b2bridge.io";

/** A cart must not be able to hang the page while the buyer waits on a price. */
const PRICING_TIMEOUT_MS = 5000;

/** Checkout creates a Shopify draft order, so it is allowed to take longer. */
const CHECKOUT_TIMEOUT_MS = 15000;

/**
 * A string discriminant rather than a boolean one: this project compiles with
 * `strict: false`, and TypeScript will not narrow a `true`/`false` discriminant
 * without `strictNullChecks`.
 */
export type HeadlessResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "failed"; failure: Failure };

export function isHeadlessConfigured(env: Env): boolean {
  return Boolean(env.HEADLESS_B2B_TOKEN && env.PUBLIC_STORE_DOMAIN);
}

/**
 * Catches the request bugs the API would answer with `INVALID_REQUEST`.
 *
 * Worth doing before the call rather than after it: the rate limit is 20
 * requests a minute across every B2Bridge endpoint, and spending one to be
 * told the body was malformed is a request the cart does not get back.
 */
function requestProblem(request: HeadlessRequest): string | null {
  if (request.lines.length < 1 || request.lines.length > MAX_LINES) {
    return `lines must hold 1 to ${MAX_LINES} entries, got ${request.lines.length}`;
  }
  const seen = new Set<string>();
  for (const line of request.lines) {
    if (seen.has(line.variantId)) {
      return `variant ${line.variantId} appears twice — merge the cart lines first`;
    }
    seen.add(line.variantId);
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_QUANTITY
    ) {
      return `variant ${line.variantId} has quantity ${line.quantity}`;
    }
  }
  return null;
}

async function post<T extends { success: true }>(
  env: Env,
  path: string,
  request: HeadlessRequest,
  timeoutMs: number,
): Promise<HeadlessResult<T>> {
  const problem = requestProblem(request);
  if (problem) {
    // Logged like a real failure: a request refused here never reaches
    // B2Bridge, so without this line it leaves no trace to debug from.
    console.warn(`[B2Bridge] ${path} refused locally: ${problem}`);
    return {
      kind: "failed",
      failure: {
        action: "FIX_REQUEST",
        code: "INVALID_REQUEST",
        status: 0,
        message: problem,
      },
    };
  }

  let status = 0;
  let body: unknown = null;
  try {
    const response = await fetch(`${B2BRIDGE_HOST}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-b2bridge-api-key": env.HEADLESS_B2B_TOKEN,
      },
      body: JSON.stringify({ ...request, domain: env.PUBLIC_STORE_DOMAIN }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    status = response.status;
    body = await response.json().catch(() => null);
  } catch (error) {
    // A timeout or a dead socket. `status` stays 0, which classifies as
    // retryable — `fetchCheckout` narrows that further.
    return {
      kind: "failed",
      failure: {
        action: "RETRY_LATER",
        code: null,
        status: 0,
        message: (error as Error)?.message ?? "request failed",
      },
    };
  }

  if (!isSuccess<T>(body)) {
    const failure = classifyFailure(status, body);
    console.warn(
      `[B2Bridge] ${path} ${status} ${failure.code ?? "-"}: ${failure.message}`,
    );
    return { kind: "failed", failure };
  }
  return { kind: "ok", data: body };
}

/**
 * Prices a cart. Call it when the cart has settled, not on every keystroke.
 *
 * A cart that breaks an order limit is a success, not a failure: the result
 * carries `canCheckout: false` and a populated `errors`, and both belong in
 * the cart UI.
 */
export function fetchCartPricing(
  env: Env,
  request: HeadlessRequest,
): Promise<HeadlessResult<CartPricing>> {
  return post<CartPricing>(
    env,
    "/api/v1/headless/cart-pricing",
    request,
    PRICING_TIMEOUT_MS,
  );
}

/**
 * Prices the cart again and creates the draft order to pay for.
 *
 * Call this only when the buyer clicks checkout. Every call creates a new
 * draft order, there is no endpoint to delete one, and B2Bridge does not
 * reuse an earlier `cart-pricing` result.
 *
 * A timeout is treated as fatal rather than retryable, which is the one place
 * this differs from `cart-pricing`. When the request dies without an answer
 * there is no way to tell whether Shopify created the draft order, so retrying
 * risks charging the buyer twice; blocking and letting them look at their
 * orders is the recoverable mistake.
 */
export async function fetchCheckout(
  env: Env,
  request: HeadlessRequest,
): Promise<HeadlessResult<CheckoutResult>> {
  const result = await post<CheckoutResult>(
    env,
    "/api/v1/headless/checkout",
    request,
    CHECKOUT_TIMEOUT_MS,
  );
  if (result.kind === "ok") {
    return result;
  }

  const { failure } = result;
  if (failure.status === 0 && failure.code === null) {
    return {
      kind: "failed",
      failure: {
        ...failure,
        action: "BLOCK",
        message: `${failure.message} — a draft order may have been created; do not retry`,
      },
    };
  }
  return result;
}
