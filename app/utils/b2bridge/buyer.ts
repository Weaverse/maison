import type { Group } from "./types";

/**
 * Deciding which B2Bridge groups a buyer belongs to.
 *
 * Kept free of any dependency on the environment or the network so the
 * unauthorized path — the one where a buyer must *not* be priced — can be
 * tested directly by `scripts/b2bridge-probe.mjs`.
 */

/**
 * `gid://shopify/Customer/7875968794841` → `7875968794841`.
 *
 * B2Bridge stores bare numeric ids in `customer_ids`, while the Customer
 * Account API returns GIDs, so one side has to be converted before they can be
 * compared.
 */
export function customerIdFromGid(
  gid: string | null | undefined,
): string | null {
  if (!gid) {
    return null;
  }
  const match = /\/Customer\/(\d+)/.exec(gid);
  return match ? match[1] : null;
}

/**
 * Which groups this buyer belongs to.
 *
 * B2Bridge offers two ways to bind a customer to a group — an explicit id in
 * `customer_ids`, or a matching `customer_tags` value — and does not document
 * which one wins, so both are honoured.
 *
 * Reading it as OR rather than AND is the safer default here: neither binding
 * is under the buyer's control, so the failure mode is a wholesale buyer who
 * should see a group and does, not an outsider who slips into one. Still worth
 * confirming with B2Bridge.
 *
 * Note that `customer_tags` is unreachable from a headless storefront today —
 * the Customer Account API's `Customer` type exposes no `tags` field — so in
 * practice only the id path fires unless tags are fetched through the Admin API.
 */
export function matchGroups(
  groups: Group[],
  customerId: string | null,
  customerTags: string[] = [],
): Group[] {
  const tags = new Set(customerTags.map((tag) => tag.toLowerCase()));
  return groups.filter((group) => {
    if (customerId && group.customerIds.includes(customerId)) {
      return true;
    }
    return Boolean(
      group.customerTag && tags.has(group.customerTag.toLowerCase()),
    );
  });
}

/** The rule ids every matched group points at, de-duplicated. */
export function ruleIdsForGroups(groups: Group[]): number[] {
  return [...new Set(groups.flatMap((group) => group.pricingRuleIds))].filter(
    (id) => id > 0,
  );
}
