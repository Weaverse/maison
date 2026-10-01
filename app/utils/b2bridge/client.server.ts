import { CacheShort } from "@shopify/hydrogen";
import { matchGroups, ruleIdsForGroups } from "./buyer";
import { normalizeGroup, normalizeRule } from "./normalize";
import { overlaysForRule, pickRule } from "./pricing";
import type { Group, RawGroup, RawRule, Rule, VariantOverlay } from "./types";

export { customerIdFromGid, matchGroups } from "./buyer";

/**
 * Server-only access to the B2Bridge Public API.
 *
 * This file is the whole security boundary for the integration: the API key is
 * read here and nowhere else, and only computed per-variant prices are handed
 * back to the loader. Group records are deliberately *not* returned — they
 * carry `customer_ids`, the shop's customer list, which must never reach a
 * loader payload and therefore the browser.
 */

const B2BRIDGE_HOST = "https://b2bridge-public-api.b2bridge.io";

/** A slow pricing service must not be able to hang a product page. */
const REQUEST_TIMEOUT_MS = 3000;

type FetchWithCache = <T>(
  url: string,
  options?: RequestInit & { strategy?: ReturnType<typeof CacheShort> },
) => Promise<T>;

export interface B2BridgeDeps {
  env: Env;
  /** `context.weaverse.fetchWithCache` — the repo's existing cached fetch. */
  fetchWithCache: FetchWithCache;
}

export interface ResolveArgs extends B2BridgeDeps {
  /** Bare numeric Shopify customer id, not a GID. `null` for guests. */
  customerId: string | null;
  /** Shopify customer tags, when available. */
  customerTags?: string[];
  /** Storefront country, e.g. "CA". Decides whether a scoped rule applies. */
  country: string;
  /** Taken from the Shopify variant — B2Bridge prices carry no currency. */
  currencyCode: string;
}

export function isB2BridgeConfigured(env: Env): boolean {
  return Boolean(env.HEADLESS_B2B_TOKEN && env.PUBLIC_STORE_DOMAIN);
}

/**
 * A customer id to price every request as, for local testing only.
 *
 * Signing in through the Customer Account API needs the OAuth tunnel from
 * `npm run dev:ca` and access to the buyer's inbox, which makes "does the page
 * actually render the wholesale price?" an expensive question to ask. Setting
 * `B2BRIDGE_DEV_CUSTOMER_ID` answers it directly.
 *
 * Refuses to work in production, because leaving it set there would serve one
 * buyer's negotiated prices to every visitor. It also logs on every request it
 * affects, so it cannot be running unnoticed.
 */
export function devCustomerIdOverride(env: Env): string | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  const customerId = env.B2BRIDGE_DEV_CUSTOMER_ID;
  if (!customerId) {
    return null;
  }
  console.warn(
    `[B2Bridge] DEV OVERRIDE ACTIVE — pricing this request as customer ${customerId}. ` +
      "Unset B2BRIDGE_DEV_CUSTOMER_ID when you are done.",
  );
  return customerId;
}

/**
 * Every B2Bridge response must be checked for `success === true`.
 *
 * Status codes cannot be trusted: a wrong key, a missing key and an unknown
 * shop all come back as **HTTP 200** with only `{"message": "..."}` in the
 * body, while a missing rule id returns 404. `success` is the only reliable
 * signal, so anything without it is treated as a failure.
 */
function assertOk<T extends { success?: boolean; message?: string }>(
  payload: T,
  what: string,
): T {
  if (payload?.success !== true) {
    throw new Error(
      `${what}: ${payload?.message ?? "unexpected B2Bridge response"}`,
    );
  }
  return payload;
}

async function get<T extends { success?: boolean; message?: string }>(
  { env, fetchWithCache }: B2BridgeDeps,
  path: string,
  params: Record<string, string>,
  what: string,
): Promise<T> {
  const url = new URL(`${B2BRIDGE_HOST}${path}`);
  url.searchParams.set("domain", env.PUBLIC_STORE_DOMAIN);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const payload = await fetchWithCache<T>(url.toString(), {
    headers: { "x-b2bridge-api-key": env.HEADLESS_B2B_TOKEN },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    // Short on purpose. B2Bridge publishes no webhook for rule changes, so
    // polling is the only way a merchant's edit reaches the storefront, and a
    // long TTL would make a price change look broken. Revisit once B2Bridge
    // states a rate limit — see the open questions in the epic.
    strategy: CacheShort(),
  });

  return assertOk(payload, what);
}

/** Shop-level, buyer-independent — safe to cache. */
async function fetchGroups(deps: B2BridgeDeps): Promise<Group[]> {
  const payload = await get<{ success?: boolean; groups?: RawGroup[] }>(
    deps,
    "/api/v1/customer-groups/get-by-domain",
    {},
    "customer-groups/get-by-domain",
  );
  return (payload.groups ?? []).map(normalizeGroup);
}

/** Shop-level, buyer-independent — safe to cache. */
async function fetchRule(deps: B2BridgeDeps, id: number): Promise<Rule> {
  const payload = await get<{ success?: boolean; rule?: RawRule }>(
    deps,
    "/api/v1/pricing-lists/get-by-id",
    { id: String(id) },
    `pricing-lists/get-by-id?id=${id}`,
  );
  if (!payload.rule) {
    throw new Error(`pricing-lists/get-by-id?id=${id}: no rule in response`);
  }
  return normalizeRule(payload.rule);
}

/**
 * Resolves the B2Bridge prices for one buyer, keyed by bare numeric variant id.
 *
 * Returns `null` whenever B2Bridge should not price this request — unconfigured,
 * guest, no matching group, no rule for this market, or a dependency failure.
 * Every one of those paths leaves the Shopify price in place, so the storefront
 * fails safe rather than showing a number it is not sure about.
 */
export async function resolveB2BridgeOverlays({
  env,
  fetchWithCache,
  customerId,
  customerTags,
  country,
  currencyCode,
}: ResolveArgs): Promise<Map<string, VariantOverlay> | null> {
  if (!isB2BridgeConfigured(env)) {
    return null;
  }
  // Guests have no group, so there is nothing to resolve and no reason to spend
  // a request finding that out.
  if (!customerId && !customerTags?.length) {
    return null;
  }

  const deps = { env, fetchWithCache };

  try {
    const groups = await fetchGroups(deps);
    const matched = matchGroups(groups, customerId, customerTags);
    if (matched.length === 0) {
      return null;
    }

    const ruleIds = ruleIdsForGroups(matched);
    if (ruleIds.length === 0) {
      return null;
    }

    const settled = await Promise.allSettled(
      ruleIds.map((id) => fetchRule(deps, id)),
    );
    const rules: Rule[] = [];
    for (const result of settled) {
      if (result.status === "fulfilled") {
        rules.push(result.value);
      } else {
        console.warn("[B2Bridge] rule fetch failed:", result.reason?.message);
      }
    }

    const rule = pickRule(rules, country);
    if (!rule) {
      return null;
    }

    const overlays = overlaysForRule(rule, currencyCode);
    return overlays.size > 0 ? overlays : null;
  } catch (error) {
    // Never throw from here. A pricing dependency being down must degrade to
    // Shopify's own price, not take the product page with it.
    console.warn("[B2Bridge] pricing unavailable:", (error as Error)?.message);
    return null;
  }
}
