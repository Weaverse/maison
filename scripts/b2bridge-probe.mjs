#!/usr/bin/env node
/**
 * Exercises the B2Bridge pricing logic.
 *
 *   node scripts/b2bridge-probe.mjs                  offline, fixture-based checks
 *   node scripts/b2bridge-probe.mjs --live           list groups and rules
 *   node scripts/b2bridge-probe.mjs --live --customer 123  resolve for one buyer
 *
 * Two reasons this exists rather than a test file:
 *
 * 1. The repo has no unit-test runner — Playwright is the only test dependency —
 *    so the pure pricing modules are bundled with esbuild and checked here with
 *    `node:test`, which needs nothing installed.
 * 2. The B2Bridge API does not match its own documentation, so a way to look at
 *    the real payloads without booting the storefront is worth keeping around.
 *
 * The fixtures below are captures from `maison-plus-2.myshopify.com`,
 * rule 8985 and customer group 1213, on 2026-10-13. The rule prices 12
 * variants live; the two kept here are all the pricing logic needs.
 * Re-capture with `--live` whenever the dev store is reconfigured.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://b2bridge-public-api.b2bridge.io";

const argv = process.argv.slice(2);
const LIVE = argv.includes("--live");
const CUSTOMER_ARG = (() => {
  const i = argv.indexOf("--customer");
  return i >= 0 ? argv[i + 1] : null;
})();

// --- Loading the pure modules -------------------------------------------------

/**
 * Bundles the dependency-free half of the integration so plain node can import
 * it. `client.server.ts` is deliberately left out: it pulls in Hydrogen, and
 * everything worth asserting on lives in the pure modules anyway.
 */
function loadModules() {
  const dir = mkdtempSync(path.join(tmpdir(), "b2bridge-"));
  const entry = path.join(dir, "entry.ts");
  const out = path.join(dir, "bundle.mjs");
  writeFileSync(
    entry,
    ["normalize", "pricing", "apply", "buyer", "headless"]
      .map((m) => `export * from "${ROOT}/app/utils/b2bridge/${m}";`)
      .join("\n"),
  );
  execFileSync(
    path.join(ROOT, "node_modules/.bin/esbuild"),
    [
      entry,
      "--bundle",
      "--format=esm",
      "--platform=neutral",
      "--log-level=error",
      `--outfile=${out}`,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  return {
    url: pathToFileURL(out).href,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const { url: bundleUrl, cleanup } = loadModules();
const b2b = await import(bundleUrl);
process.on("exit", cleanup);

// --- Fixtures -----------------------------------------------------------------

const VOLUME_TABLE = JSON.stringify([
  {
    volume_pricing_from: 10,
    volume_pricing_type: "PERCENT",
    volume_pricing_value: 20,
    unit_of_measure: "product",
  },
  {
    volume_pricing_from: 20,
    volume_pricing_type: "PERCENT",
    volume_pricing_value: 30,
    unit_of_measure: "product",
  },
]);

/**
 * The tiers in place when the stacking behaviour below was measured against
 * B2Bridge's own draft order, on 2026-09-28. Kept so that measurement stays
 * reproducible after the dev store's tiers were changed to 20/30.
 */
const MEASURED_VOLUME_TABLE = JSON.stringify([
  {
    volume_pricing_from: 10,
    volume_pricing_type: "PERCENT",
    volume_pricing_value: 5,
    unit_of_measure: "product",
  },
  {
    volume_pricing_from: 20,
    volume_pricing_type: "PERCENT",
    volume_pricing_value: 10,
    unit_of_measure: "product",
  },
]);

function rawVariant(variantId, price) {
  return {
    variant_id: variantId,
    product_id: "9028489281758",
    price,
    origin_price: price,
    minimum: 5,
    maximum: null,
    increment_quantity: 1,
    order_limit_by: "QUANTITY",
    volume_pricing: "[]",
    volume_limit_by: "QUANTITY",
    is_hidden: false,
  };
}

const RAW_RULE_8985 = {
  id: 8985,
  shop_id: 1397,
  name: "set linen test",
  status: 1,
  priority: 0,
  variant_visibility: "all",
  market_condition_type: "SPECIFIC",
  applied_markets: { 30496850142: ["CA"] },
  discount_type: "PERCENT",
  discount_value: "0",
  discount_direction: "DECREASE",
  volume_type: "QUANTITY",
  volume_apply: "EVERY_PRODUCT",
  volume_table: VOLUME_TABLE,
  limit_type: "CUSTOMIZE",
  limit_apply: "EVERY_PRODUCT",
  minimum: "1",
  maximum: "100",
  increment_quantity: 1,
  start_date: "2026-09-26 21:30:00",
  end_date: null,
  enable_end_date: 0,
  pricingListVariants: [
    rawVariant("47591719436510", 325),
    rawVariant("47591720878302", 390),
  ],
};

const RAW_GROUP = {
  id: 1213,
  name: "customer group test 1",
  customer_tags: "b2b-test-1",
  customer_ids: '["9196237291742"]',
  pricing_rule_ids: "[8985]",
};

// --- Headless Cart & Checkout API captures ------------------------------------
//
// Verbatim responses from `cart-pricing` on 2026-10-13, buyer 9196237291742,
// variant 47591719436510 of rule 8985, market CA.

const CART_PRICING_QTY_5 = {
  success: true,
  currency: "USD",
  lines: [
    {
      variantId: "gid://shopify/ProductVariant/47591719436510",
      productId: "gid://shopify/Product/9028489281758",
      quantity: 5,
      originalUnitPrice: 325,
      unitPrice: 325,
      lineTotal: 1625,
      hasRule: true,
      minimum: 5,
      maximum: null,
      increment: 1,
    },
  ],
  subtotal: 1625,
  errors: [],
  canCheckout: true,
};

/** Below the variant's minimum of 5 — still a 200, still `success: true`. */
const CART_PRICING_QTY_3 = {
  ...CART_PRICING_QTY_5,
  lines: [{ ...CART_PRICING_QTY_5.lines[0], quantity: 3, lineTotal: 975 }],
  subtotal: 975,
  errors: [
    {
      scope: "VARIANT",
      code: "BELOW_MINIMUM",
      limitBy: "QUANTITY",
      variantId: "47591719436510",
      minimum: 5,
      maximum: null,
      current: 3,
      message:
        "Bold Stripe Linen Duvet - Queen / White Stripe must be at least 5 items to checkout",
    },
  ],
  canCheckout: false,
};

/** What a wrong API key answers. HTTP 200, and no `success` anywhere. */
const AUTH_FAILURE_BODY = { message: "Access key is not correct" };

// --- Offline checks -----------------------------------------------------------

if (!LIVE) {
  test("parseJsonField absorbs every shape the API sends", () => {
    const { parseJsonField } = b2b;
    assert.deepEqual(parseJsonField("[1,2]", []), [1, 2]);
    // `applied_markets` arrives already decoded while its neighbours do not.
    assert.deepEqual(parseJsonField({ a: ["CA"] }, {}), { a: ["CA"] });
    // An unset volume_table is "" and an unset nt_time_custom is the literal
    // string "null"; neither may throw.
    assert.deepEqual(parseJsonField("", []), []);
    assert.deepEqual(parseJsonField("null", []), []);
    assert.deepEqual(parseJsonField("{oops", []), []);
  });

  test("normalizeRule unpacks the wire format", () => {
    const rule = b2b.normalizeRule(RAW_RULE_8985);
    assert.equal(rule.enabled, true);
    assert.equal(rule.discountValue, 0, "numeric string coerced");
    assert.deepEqual(
      rule.appliedCountries,
      ["CA"],
      "market ids dropped, countries kept",
    );
    assert.equal(rule.volumeTable.length, 2, "JSON-in-string parsed");
    assert.deepEqual(
      rule.volumeTable.map((t) => t.fromQuantity),
      [10, 20],
      "tiers sorted ascending",
    );
    assert.equal(rule.variants.length, 2);
  });

  test("a rule scoped to a market prices only that market", () => {
    const rule = b2b.normalizeRule(RAW_RULE_8985);
    assert.equal(b2b.marketApplies(rule, "CA"), true);
    assert.equal(b2b.marketApplies(rule, "US"), false, "this is the A/B proof");
    assert.equal(b2b.marketApplies(rule, "ca"), true, "case-insensitive");

    const everywhere = b2b.normalizeRule({
      ...RAW_RULE_8985,
      market_condition_type: "ALL",
      applied_markets: {},
    });
    assert.equal(b2b.marketApplies(everywhere, "VN"), true);

    // SPECIFIC with nothing listed must match nothing: reading it as "all"
    // would price every market in the world.
    const scopedToNothing = b2b.normalizeRule({
      ...RAW_RULE_8985,
      applied_markets: {},
    });
    assert.equal(b2b.marketApplies(scopedToNothing, "CA"), false);
  });

  test("disabled and future-dated rules never price", () => {
    assert.equal(
      b2b.ruleIsActive(b2b.normalizeRule({ ...RAW_RULE_8985, status: 0 })),
      false,
    );
    const future = b2b.normalizeRule({
      ...RAW_RULE_8985,
      start_date: "2099-01-01 00:00:00.000",
    });
    assert.equal(b2b.ruleIsActive(future), false);
    const expired = b2b.normalizeRule({
      ...RAW_RULE_8985,
      enable_end_date: 1,
      end_date: "2020-01-01 00:00:00.000",
    });
    assert.equal(b2b.ruleIsActive(expired), false);
  });

  test("volume tiers become Shopify price breaks", () => {
    const rule = b2b.normalizeRule(RAW_RULE_8985);
    const overlays = b2b.overlaysForRule(rule, "USD");

    const queen = overlays.get("47591719436510");
    assert.equal(
      queen.price.amount,
      "325.00",
      "discount_value 0 leaves base alone",
    );
    assert.deepEqual(
      queen.quantityPriceBreaks.nodes.map((n) => [
        n.minimumQuantity,
        n.price.amount,
      ]),
      [
        [10, "260.00"],
        [20, "227.50"],
      ],
      "325 * 0.7 is 227.49999999999997 in binary — rounding must be explicit",
    );

    const king = overlays.get("47591720878302");
    assert.deepEqual(
      king.quantityPriceBreaks.nodes.map((n) => n.price.amount),
      ["312.00", "273.00"],
    );

    assert.deepEqual(
      queen.quantityRule,
      { minimum: 5, maximum: null, increment: 1 },
      "limit_type CUSTOMIZE reads the variant's own minimum",
    );
  });

  test("tiers stack on the base discount, matching B2Bridge's own checkout", () => {
    // Measured, not assumed: B2Bridge's draft order for this exact rule sends
    // Shopify `priceOverride: { amount: 299.49 }` for the $325 variant.
    // 325 × 0.97 × 0.95 = 299.4875 ✓   325 × 0.95 = 308.75 ✗
    //
    // Pinned to the tiers the measurement was taken against. The dev store has
    // since moved to 20/30, and rewriting these numbers would throw away the
    // one place B2Bridge's own arithmetic is pinned down.
    const rule = b2b.normalizeRule({
      ...RAW_RULE_8985,
      discount_value: "3",
      volume_table: MEASURED_VOLUME_TABLE,
    });
    const queen = b2b.overlaysForRule(rule, "USD").get("47591719436510");
    assert.equal(queen.price.amount, "315.25", "325 × 0.97");

    // Shopify's own price is kept beside the replacement. Reported in review
    // of #77: the product page overwrites `variant.price` with 315.25, and a
    // sibling priced by applying the product's rate to that number discounts
    // the base a second time.
    assert.equal(queen.originalPrice.amount, "325.00", "Shopify's own price");
    const rate = 1 - 299.49 / 325;
    const from = (list) =>
      (Math.round(list * (1 - rate) * 100) / 100).toFixed(2);
    assert.equal(from(Number(queen.originalPrice.amount)), "299.49");
    assert.equal(from(Number(queen.price.amount)), "290.51", "the old bug");
    assert.deepEqual(
      queen.quantityPriceBreaks.nodes.map((n) => n.price.amount),
      ["299.49", "283.73"],
      "315.25 × 0.95 and × 0.90 — the 299.49 B2Bridge itself charges",
    );

    // NEW names the price outright, so there is nothing to stack it onto.
    const absolute = b2b.normalizeRule({
      ...RAW_RULE_8985,
      discount_value: "3",
      volume_table: JSON.stringify([
        {
          volume_pricing_from: 10,
          volume_pricing_type: "NEW",
          volume_pricing_value: 200,
        },
      ]),
    });
    assert.equal(
      b2b.overlaysForRule(absolute, "USD").get("47591719436510")
        .quantityPriceBreaks.nodes[0].price.amount,
      "200.00",
    );
  });

  test("rule dates are read as UTC, not as server-local time", () => {
    // B2Bridge sends start_date with no marker. In the 2026-09-28 capture it
    // read "2026-09-28 04:30:33.269" while the created_at beside it was
    // "2026-09-28T04:32:35.404Z" — two minutes later — so the dates are UTC
    // spelled without the Z.
    const rule = b2b.normalizeRule({
      ...RAW_RULE_8985,
      start_date: "2026-09-28 04:30:00.000",
    });
    // One minute before the start, in UTC, the rule must not be active yet.
    assert.equal(
      b2b.ruleIsActive(rule, new Date("2026-09-28T04:29:00.000Z")),
      false,
    );
    assert.equal(
      b2b.ruleIsActive(rule, new Date("2026-09-28T04:31:00.000Z")),
      true,
    );
  });

  test("base discounts apply to origin_price", () => {
    const tenOff = b2b.normalizeRule({
      ...RAW_RULE_8985,
      discount_value: "10",
    });
    assert.equal(
      b2b.overlaysForRule(tenOff, "USD").get("47591719436510").price.amount,
      "292.50",
    );

    const fixed = b2b.normalizeRule({
      ...RAW_RULE_8985,
      discount_type: "FIXED",
      discount_value: "25",
    });
    assert.equal(
      b2b.overlaysForRule(fixed, "USD").get("47591719436510").price.amount,
      "300.00",
    );

    const flat = b2b.normalizeRule({
      ...RAW_RULE_8985,
      discount_type: "NEW",
      discount_value: "199",
    });
    assert.equal(
      b2b.overlaysForRule(flat, "USD").get("47591719436510").price.amount,
      "199.00",
    );

    const markup = b2b.normalizeRule({
      ...RAW_RULE_8985,
      discount_value: "10",
      discount_direction: "INCREASE",
    });
    assert.equal(
      b2b.overlaysForRule(markup, "USD").get("47591719436510").price.amount,
      "357.50",
    );
  });

  test("shapes Shopify cannot express are skipped, not approximated", () => {
    // AMOUNT prices by money spent; quantityPriceBreaks only has a quantity.
    const byAmount = b2b.normalizeRule({
      ...RAW_RULE_8985,
      volume_type: "AMOUNT",
    });
    assert.equal(b2b.volumeIsRepresentable(byAmount), false);
    assert.equal(b2b.overlaysForRule(byAmount, "USD").size, 0);

    // TOTAL_PRODUCT makes a tier depend on the rest of the cart, so a product
    // page cannot know the price at all.
    const byCartTotal = b2b.normalizeRule({
      ...RAW_RULE_8985,
      volume_apply: "TOTAL_PRODUCT",
    });
    assert.equal(b2b.volumeIsRepresentable(byCartTotal), false);
  });

  test("quantity rules never overwrite Shopify's default with an empty one", () => {
    // variant-row.tsx:333 reads variant.quantityRule.increment with no guard.
    const limited = b2b.normalizeRule({
      ...RAW_RULE_8985,
      limit_type: "QUANTITY",
      minimum: "5",
      maximum: "50",
      increment_quantity: 5,
    });
    const rule = b2b
      .overlaysForRule(limited, "USD")
      .get("47591719436510").quantityRule;
    assert.deepEqual(rule, { minimum: 5, maximum: 50, increment: 5 });

    // B2Bridge spells "no minimum" as 0; Shopify's contract starts at 1.
    const zeroed = b2b.normalizeRule({
      ...RAW_RULE_8985,
      limit_type: "QUANTITY",
      minimum: "0",
      maximum: "0",
      increment_quantity: 0,
    });
    assert.deepEqual(
      b2b.overlaysForRule(zeroed, "USD").get("47591719436510").quantityRule,
      {
        minimum: 1,
        maximum: null,
        increment: 1,
      },
    );
  });

  test("hidden variants are not priced", () => {
    const rule = b2b.normalizeRule({
      ...RAW_RULE_8985,
      pricingListVariants: [
        { ...rawVariant("47591719436510", 325), is_hidden: true },
      ],
    });
    assert.equal(b2b.overlaysForRule(rule, "USD").size, 0);
  });

  test("group matching decides who is priced", () => {
    const group = b2b.normalizeGroup(RAW_GROUP);
    assert.deepEqual(group.pricingRuleIds, [8985]);

    assert.equal(b2b.matchGroups([group], "9196237291742").length, 1, "by id");
    assert.equal(
      b2b.matchGroups([group], null, ["b2b-test-1"]).length,
      1,
      "by tag",
    );
    assert.equal(
      b2b.matchGroups([group], "9999999999").length,
      0,
      "unauthorized buyer",
    );
    assert.equal(b2b.matchGroups([group], null).length, 0, "guest");
    assert.deepEqual(b2b.ruleIdsForGroups([group]), [8985]);
  });

  test("customer GIDs reduce to the bare ids B2Bridge stores", () => {
    assert.equal(
      b2b.customerIdFromGid("gid://shopify/Customer/9196237291742"),
      "9196237291742",
    );
    assert.equal(b2b.customerIdFromGid(null), null);
    assert.equal(b2b.customerIdFromGid("gid://shopify/Product/1"), null);
  });

  test("the winning rule is stable when several match", () => {
    const base = b2b.normalizeRule(RAW_RULE_8985);
    const higher = { ...base, id: 1, priority: 5 };
    const lower = { ...base, id: 2, priority: 1 };
    assert.equal(b2b.pickRule([lower, higher], "CA").id, 1, "priority wins");
    // B2Bridge documents no tie-break; the older rule wins so the outcome does
    // not depend on response order.
    assert.equal(
      b2b.pickRule(
        [
          { ...base, id: 9 },
          { ...base, id: 3 },
        ],
        "CA",
      ).id,
      3,
    );
    assert.equal(
      b2b.pickRule([base], "US"),
      null,
      "market gate applies here too",
    );
  });

  test("overlays reach every copy of a variant in the product graph", () => {
    const overlays = b2b.overlaysForRule(
      b2b.normalizeRule(RAW_RULE_8985),
      "USD",
    );
    const variant = () => ({
      id: "gid://shopify/ProductVariant/47591719436510",
      price: { amount: "325.0", currencyCode: "CAD" },
      quantityPriceBreaks: { nodes: [] },
      quantityRule: { minimum: 1, maximum: null, increment: 1 },
    });
    // PRODUCT_QUERY returns the same variant through several paths.
    const product = {
      selectedOrFirstAvailableVariant: variant(),
      adjacentVariants: [variant()],
      variants: {
        nodes: [
          variant(),
          {
            id: "gid://shopify/ProductVariant/1",
            price: { amount: "9.0", currencyCode: "USD" },
            quantityPriceBreaks: { nodes: [] },
          },
        ],
      },
      options: [{ optionValues: [{ firstSelectableVariant: variant() }] }],
    };

    assert.equal(
      b2b.applyOverlays(product, overlays),
      4,
      "every copy rewritten",
    );
    assert.equal(
      product.selectedOrFirstAvailableVariant.price.amount,
      "325.00",
    );
    assert.equal(
      product.options[0].optionValues[0].firstSelectableVariant
        .quantityPriceBreaks.nodes.length,
      2,
    );
    // Currency comes from the Shopify variant, never from B2Bridge.
    assert.equal(product.adjacentVariants[0].price.currencyCode, "CAD");
    assert.equal(
      product.adjacentVariants[0].quantityPriceBreaks.nodes[0].price
        .currencyCode,
      "CAD",
    );
    // A variant the rule does not cover is left exactly as Shopify sent it.
    assert.equal(product.variants.nodes[1].price.amount, "9.0");

    assert.equal(
      b2b.applyOverlays(product, new Map()),
      0,
      "no overlays, no writes",
    );
  });

  test("a cyclic product object cannot hang the walker", () => {
    const product = { variants: { nodes: [] } };
    product.self = product;
    assert.equal(b2b.applyOverlays(product, new Map([["1", {}]])), 0);
  });

  // --- Headless Cart & Checkout API -------------------------------------------

  test("cart lines are merged to one line per variant", () => {
    // Two lines of the same variant is what engraving, delivery batches and
    // selling plans all produce; B2Bridge rejects the cart outright.
    const { lines, sources } = b2b.mergeLines([
      { id: "line-1", variantId: "47591719436510", quantity: 20 },
      { id: "line-2", variantId: "47591720878302", quantity: 2 },
      {
        id: "line-3",
        variantId: "gid://shopify/ProductVariant/47591719436510",
        quantity: 30,
      },
    ]);

    assert.deepEqual(lines, [
      { variantId: "47591719436510", quantity: 50 },
      { variantId: "47591720878302", quantity: 2 },
    ]);
    // 20 and 30 sent apart would each price at their own tier; 50 reaches the
    // one the merchant configured.
    assert.deepEqual(sources.get("47591719436510"), ["line-1", "line-3"]);
  });

  test("merging drops quantities the API would reject", () => {
    const { lines } = b2b.mergeLines([
      { id: "line-1", variantId: "47591719436510", quantity: 0 },
      { id: "line-2", variantId: "47591720878302", quantity: 1 },
    ]);
    assert.deepEqual(lines, [{ variantId: "47591720878302", quantity: 1 }]);
  });

  test("the dedupe key survives reordering and notices the market", () => {
    const base = {
      domain: "maison-plus-2.myshopify.com",
      customerId: "gid://shopify/Customer/9196237291742",
      lines: [
        { variantId: "47591719436510", quantity: 5 },
        { variantId: "47591720878302", quantity: 2 },
      ],
      market: { id: "gid://shopify/Market/30496850142", countryCode: "CA" },
    };
    // Removing an item and adding it back must not spend a request.
    const reordered = { ...base, lines: [...base.lines].reverse() };
    assert.equal(b2b.pricingKey(base), b2b.pricingKey(reordered));

    // GIDs and bare ids are the same buyer.
    const bareId = { ...base, customerId: "9196237291742" };
    assert.equal(b2b.pricingKey(base), b2b.pricingKey(bareId));

    // Rule 8985 is scoped to CA, so the country changes the price while the
    // cart does not. The epic's own dedupe list leaves `market` out.
    const inUs = { ...base, market: { ...base.market, countryCode: "US" } };
    assert.notEqual(b2b.pricingKey(base), b2b.pricingKey(inUs));

    const quantityChanged = {
      ...base,
      lines: [{ variantId: "47591719436510", quantity: 6 }, base.lines[1]],
    };
    assert.notEqual(b2b.pricingKey(base), b2b.pricingKey(quantityChanged));
  });

  test("success is read from the body, never from the status", () => {
    assert.equal(b2b.isSuccess(CART_PRICING_QTY_5), true);
    // The whole reason this gate exists: HTTP 200, and not a result.
    assert.equal(b2b.isSuccess(AUTH_FAILURE_BODY), false);
    assert.equal(b2b.isSuccess(null), false);
    assert.equal(b2b.isSuccess(undefined), false);
    assert.equal(b2b.isSuccess("Access key is not correct"), false);
  });

  test("an order-limit violation is a result, not a failure", () => {
    // A cart below its minimum must reach the cart UI as errors to render.
    assert.equal(b2b.isSuccess(CART_PRICING_QTY_3), true);
    assert.equal(CART_PRICING_QTY_3.canCheckout, false);
    assert.equal(CART_PRICING_QTY_3.errors[0].scope, "VARIANT");
  });

  test("failures are classified into what the storefront should do", () => {
    // A rate limit carries no `code`, so only the status identifies it.
    assert.equal(b2b.classifyFailure(429, {}).action, "RETRY_BACKOFF");
    assert.equal(b2b.classifyFailure(503, {}).action, "RETRY_LATER");
    // No answer at all.
    assert.equal(b2b.classifyFailure(0, null).action, "RETRY_LATER");

    assert.equal(
      b2b.classifyFailure(422, { code: "ORDER_LIMIT_VIOLATION" }).action,
      "SHOW_ERRORS",
    );
    assert.equal(
      b2b.classifyFailure(404, { code: "VARIANT_NOT_FOUND" }).action,
      "DROP_LINES",
    );
    assert.equal(
      b2b.classifyFailure(400, { code: "INVALID_REQUEST" }).action,
      "FIX_REQUEST",
    );

    // Plan and permission failures leave nothing to do but stop.
    assert.equal(
      b2b.classifyFailure(403, { code: "PLAN_INACTIVE" }).action,
      "BLOCK",
    );
    // And the gateway's own auth reply, which arrives as a 200.
    const auth = b2b.classifyFailure(200, AUTH_FAILURE_BODY);
    assert.equal(auth.action, "BLOCK");
    assert.equal(auth.code, null);
    assert.equal(auth.message, "Access key is not correct");
  });

  test("the + then - walk does not spend a second request", () => {
    const TTL = 30_000;
    const ask = (over) =>
      b2b.fetchDecision({
        key: "A",
        settled: true,
        inFlight: null,
        cachedAt: null,
        now: 1000,
        ttlMs: TTL,
        ...over,
      });

    // Quantity 5, never priced before.
    assert.equal(ask({}), "fetch");
    // Clicking + walks the cart A -> B; B is new, so it is priced.
    assert.equal(ask({ key: "B" }), "fetch");
    // Clicking - walks it back to A, which was priced a moment ago. A guard
    // that remembered only the latest key would call this new and refetch.
    assert.equal(ask({ cachedAt: 900 }), "use-cache");
    // Once the answer is old enough to distrust, ask again.
    assert.equal(ask({ cachedAt: 900 - TTL }), "fetch");
  });

  test("nothing is priced while the cart is still moving", () => {
    const base = {
      key: "A",
      settled: true,
      inFlight: null,
      cachedAt: null,
      now: 1000,
      ttlMs: 30_000,
    };
    // Four fast clicks on + leave the optimistic cart ahead of the server's.
    // Pricing each step would spend four requests out of twenty a minute.
    assert.equal(b2b.fetchDecision({ ...base, settled: false }), "wait");
    // One request per key at a time.
    assert.equal(b2b.fetchDecision({ ...base, inFlight: "A" }), "wait");
    // A request for a different key does not block this one.
    assert.equal(b2b.fetchDecision({ ...base, inFlight: "B" }), "fetch");
    // An empty cart asks nothing.
    assert.equal(b2b.fetchDecision({ ...base, key: "" }), "idle");
  });

  test("a bad moment is not cached into a broken quantity", () => {
    // Caching a failure would make one rate-limited call look like "quantity
    // 10 is broken" for the whole TTL, replayed on every return to it.
    // These are the route's states, not B2Bridge's raw replies.
    assert.equal(
      b2b.shouldCache({ status: "priced", canCheckout: true }),
      true,
    );
    assert.equal(
      b2b.shouldCache({ status: "priced", canCheckout: false }),
      true,
      "a cart below its minimum is still priced",
    );
    assert.equal(
      b2b.shouldCache({ status: "unavailable", retryable: true }),
      false,
    );
    assert.equal(b2b.shouldCache({ status: "not-applicable" }), false);
    assert.equal(b2b.shouldCache(null), false);
  });

  test("every mounted provider learns the answer, in any order", () => {
    // The drawer and the product page's variant list share one request.
    // Whichever handles the response first clears the in-flight key; the
    // others must still be able to tell that their figures are current, or
    // their spinners never stop.
    assert.equal(b2b.answeredKeyFor("A", null), "A", "the one that asked");
    assert.equal(b2b.answeredKeyFor(null, "A"), "A", "the ones that did not");
    // A provider mounted after the answer landed is current, not stale.
    assert.equal(b2b.answeredKeyFor(null, "B"), "B");
    // Nothing has ever been answered, so nothing is current.
    assert.equal(b2b.answeredKeyFor(null, null), null);
  });

  test("an answer overtaken by a newer cart is kept but not shown", () => {
    // Click + (request goes out for B), click - before it lands (back to A,
    // served from cache). B's answer then describes a cart the buyer left.
    assert.equal(b2b.isAnswerCurrent("A", "A"), true);
    assert.equal(
      b2b.isAnswerCurrent("B", "A"),
      false,
      "applying it would show prices for a cart they are no longer looking at",
    );
    // And would mark the view out of date for a key that never comes round
    // again, which is a spinner that never stops.
    assert.equal(b2b.isAnswerCurrent(null, "A"), false);
  });

  test("only the variant the buyer moved is marked as recalculating", () => {
    // The real shape, captured from the running storefront on 2026-10-15: a
    // sorted `variantId:quantity` list and nothing else. An earlier version of
    // this test invented a five-part key, so it kept passing while the parser
    // read a field that was never there and always returned nothing.
    const key = (lines) => lines;
    const before = key("A:5,B:3");

    // A `+` on A leaves B alone; one row spins, not the whole table.
    assert.deepEqual([...b2b.changedVariants(before, key("A:6,B:3"))], ["A"]);
    // Removing a line counts as a change to it.
    assert.deepEqual([...b2b.changedVariants(before, key("A:5"))], ["B"]);
    // Adding one too.
    assert.deepEqual(
      [...b2b.changedVariants(before, key("A:5,B:3,C:1"))],
      ["C"],
    );
    // Nothing moved, so nothing spins — this is `+` then `-` back again.
    assert.deepEqual([...b2b.changedVariants(before, before)], []);
    // Before the first answer the buyer is looking at Shopify's prices, not
    // at stale B2B ones, so nothing is marked.
    assert.deepEqual([...b2b.changedVariants(null, before)], []);
    // Real ids, so a parser that mistakes the separator cannot pass this.
    assert.deepEqual(
      [
        ...b2b.changedVariants(
          "47591719436510:1,47591722352862:1",
          "47591719436510:1,47591722352862:2",
        ),
      ],
      ["47591722352862"],
    );
  });

  test("moving one variant marks its whole product, and nothing else", () => {
    // Product A holds variants A1 and A2; product B holds B1. Measured on the
    // dev store: adding A2 changed A1's price, because the tier is reached on
    // the product's combined quantity.
    const variantProducts = new Map([
      ["A1", "A"],
      ["A2", "A"],
      ["B1", "B"],
    ]);

    // A1 moving reprices A2 as well, so the answer is the product, which every
    // row of that table reads — including the variants sitting at zero.
    assert.deepEqual(
      [...b2b.changedProducts(new Set(["A1"]), variantProducts)],
      ["A"],
    );
    assert.deepEqual(
      [...b2b.changedProducts(new Set(["B1"]), variantProducts)],
      ["B"],
      "product B is reached by no rule here",
    );
    assert.deepEqual([...b2b.changedProducts(new Set(), variantProducts)], []);
    // A variant that names no product reaches nothing.
    assert.deepEqual(
      [...b2b.changedProducts(new Set(["GONE"]), variantProducts)],
      [],
    );
  });

  test("a variant nobody has added still shows its product's rate", () => {
    // Measured: one percentage per product, applied to each variant's own
    // list price. 19 at 325 and 1 at 390 both priced at exactly 30% off.
    const lines = [
      { productId: "A", unitPrice: 227.5, originalUnitPrice: 325 },
      { productId: "B", unitPrice: 135, originalUnitPrice: 135 },
    ];
    const rate = b2b.productDiscountRate(lines, "A");
    // 1 - 227.5/325 is 0.30000000000000004, so the rate carries float noise
    // and only the rounded figure is worth asserting — it is also the only
    // one anybody sees.
    assert.ok(Math.abs(rate - 0.3) < 1e-9);
    // Any variant of A is shown at that rate off its own list price,
    // including the ones at quantity zero — otherwise they read as excluded.
    const shown = (list) =>
      (Math.round(list * (1 - rate) * 100) / 100).toFixed(2);
    assert.equal(shown(390), "273.00");
    assert.equal(shown(325), "227.50");

    // No tier reached, so nothing to show but the list price.
    assert.equal(b2b.productDiscountRate(lines, "B"), null);
    assert.equal(b2b.productDiscountRate(lines, "MISSING"), null);
    assert.equal(b2b.productDiscountRate([], "A"), null);
  });

  test("one cart is recognised again, a different one is not", () => {
    // Guards against a second draft order for a cart the buyer has already
    // started paying for. Carts differ by buyer, market and every line, so
    // the fingerprint has to follow all of them.
    const cart = (q) =>
      b2b.pricingKey({
        domain: "maison-plus-2.myshopify.com",
        customerId: "9196237291742",
        lines: [{ variantId: "47591719436510", quantity: q }],
        market: { id: "gid://shopify/Market/30496850142", countryCode: "CA" },
      });

    assert.equal(b2b.fingerprint(cart(10)), b2b.fingerprint(cart(10)));
    assert.notEqual(b2b.fingerprint(cart(10)), b2b.fingerprint(cart(11)));

    // Short enough that a draft never outlives the prices frozen into it.
    assert.ok(b2b.CHECKOUT_REUSE_MS <= 60_000);
  });

  test("a paid order is subtracted from the cart, not emptied from it", () => {
    const line = (id, variantId, quantity) => ({ id, variantId, quantity });

    // Bought 10, then added a different product before coming back to pay.
    // The second product was never invoiced and has to survive.
    assert.deepEqual(
      b2b.adjustmentForPaidLines(
        [line("l1", "A", 10), line("l2", "B", 5)],
        [{ variantId: "gid://shopify/ProductVariant/A", quantity: 10 }],
      ),
      {
        updates: [],
        removals: [{ id: "l1", variantId: "A", taken: 10, quantity: 0 }],
      },
    );

    // Bought 10, then added 4 more of the same. Four are still unpaid.
    assert.deepEqual(
      b2b.adjustmentForPaidLines(
        [line("l1", "A", 14)],
        [{ variantId: "A", quantity: 10 }],
      ),
      {
        updates: [{ id: "l1", variantId: "A", taken: 10, quantity: 4 }],
        removals: [],
      },
    );

    // One variant across two cart lines — engraving, a selling plan. The paid
    // quantity comes off them in order until it runs out.
    assert.deepEqual(
      b2b.adjustmentForPaidLines(
        [line("l1", "A", 6), line("l2", "A", 6)],
        [{ variantId: "A", quantity: 10 }],
      ),
      {
        updates: [{ id: "l2", variantId: "A", taken: 4, quantity: 2 }],
        removals: [{ id: "l1", variantId: "A", taken: 6, quantity: 0 }],
      },
    );

    // Nothing in the order matches what is in the cart now.
    assert.deepEqual(
      b2b.adjustmentForPaidLines(
        [line("l1", "B", 3)],
        [{ variantId: "A", quantity: 1 }],
      ),
      { updates: [], removals: [] },
    );
  });

  test("a cart key separates buyer and market from the lines", () => {
    // Reported in review of #77: the cache is shared across providers and was
    // keyed on lines alone, so changing country with the quantities unchanged
    // answered from cache with the previous market's prices.
    const lines = "47591719436510:10";
    const ca = `/api/b2b-cart-pricing|9196237291742#${lines}`;
    const vn = `/vi-vn/api/b2b-cart-pricing|9196237291742#${lines}`;
    const guest = `/api/b2b-cart-pricing|guest#${lines}`;

    assert.notEqual(ca, vn);
    assert.notEqual(ca, guest);

    // Same lines on both sides, so nothing moved — the identity differing is
    // what makes them different keys, not a quantity change.
    assert.equal(b2b.changedVariants(ca, vn).size, 0);
    assert.equal(b2b.changedVariants(ca, guest).size, 0);

    // And a real quantity change is still seen through the prefix.
    assert.deepEqual(
      [...b2b.changedVariants(ca, `${vn.split("#")[0]}#47591719436510:15`)],
      ["47591719436510"],
    );

    // Keys with no prefix at all still parse, so nothing else has to change.
    assert.deepEqual(
      [...b2b.changedVariants("47591719436510:10", "47591719436510:15")],
      ["47591719436510"],
    );

    // Two carts can come to the same money and still be different carts, so
    // a checkout result cannot be tied to its cart by subtotal. Reported in
    // review of #77: one invoice was offered for a cart it was not raised
    // for, and where the figures happened to match, the buyer was redirected
    // to pay it. Four of A at 25 and ten of B at 10 both total 100.
    const keyFor = (entries) =>
      `/api/b2b-cart-pricing|9196237291742#${entries}`;
    assert.notEqual(keyFor("A:4"), keyFor("B:10"));
    assert.deepEqual(
      [...b2b.changedVariants(keyFor("A:4"), keyFor("B:10"))].sort(),
      ["A", "B"],
    );
  });

  test("an absolute plan is safe to apply again, however it failed", () => {
    // The two cases review of #77 left open: a mutation that landed but whose
    // response was lost, and two requests racing with the same state. Both
    // stop mattering once the plan says where lines end up rather than how
    // much to take off them.
    const line = (id, variantId, quantity) => ({ id, variantId, quantity });
    const cart = [line("l1", "A", 14), line("l2", "B", 5)];
    const paid = [
      { variantId: "A", quantity: 10 },
      { variantId: "B", quantity: 5 },
    ];

    const plan = b2b.planForPaidLines("D50", cart, paid);
    assert.deepEqual(plan.lines, [
      { id: "l1", variantId: "A", from: 14, to: 4 },
      { id: "l2", variantId: "B", from: 5, to: 0 },
    ]);

    // Nothing applied yet: both steps are owed.
    assert.deepEqual(b2b.planSteps(plan, cart), {
      updates: [{ id: "l1", quantity: 4 }],
      removals: ["l2"],
    });

    // The update landed and the reply was lost. The retry sees l1 already at
    // its target and asks only for what is left — the four unpaid A units are
    // not touched a second time.
    const midway = [line("l1", "A", 4), line("l2", "B", 5)];
    assert.ok(b2b.planStillApplies(plan, midway));
    assert.deepEqual(b2b.planSteps(plan, midway), {
      updates: [],
      removals: ["l2"],
    });

    // Both landed. Re-applying is a no-op, so a second request racing the
    // first finds nothing to do.
    const done = [line("l1", "A", 4)];
    assert.ok(b2b.planStillApplies(plan, done));
    assert.deepEqual(b2b.planSteps(plan, done), { updates: [], removals: [] });

    // The buyer added ten more of A after paying. The plan is void — setting
    // l1 to 4 would take the ten they never paid for.
    const changed = [line("l1", "A", 24), line("l2", "B", 5)];
    assert.equal(b2b.planStillApplies(plan, changed), false);

    // A line removed by the buyer rather than by us voids a plan that meant
    // to leave something behind.
    const planKeepingL1 = b2b.planForPaidLines("D51", cart, [
      { variantId: "A", quantity: 10 },
    ]);
    assert.equal(
      b2b.planStillApplies(planKeepingL1, [line("l2", "B", 5)]),
      false,
    );
  });

  test("failure details are carried through for the lines to drop", () => {
    const failure = b2b.classifyFailure(404, {
      code: "VARIANT_NOT_FOUND",
      message: "Some variants were not found",
      details: { variantIds: ["47591719436510"] },
    });
    assert.deepEqual(failure.details, { variantIds: ["47591719436510"] });
  });

  test("an increment B2Bridge will not hold to is held to here", () => {
    // Captured from rule 8985 on 2026-10-20 with increment_quantity = 5 on
    // variant 47591719436510: quantities of 7 and 12 both came back
    // canCheckout: true with an empty errors, so B2Bridge reports the
    // increment and then ignores it. These are those replies.
    const line = (quantity, over = {}) => ({
      variantId: "47591719436510",
      quantity,
      increment: 5,
      minimum: 5,
      hasRule: true,
      ...over,
    });

    assert.deepEqual(b2b.incrementBreaches([line(10)]), []);
    assert.deepEqual(b2b.incrementBreaches([line(20)]), []);

    assert.deepEqual(b2b.incrementBreaches([line(12)]), [
      { variantId: "47591719436510", quantity: 12, increment: 5, allowed: 10 },
    ]);
    assert.deepEqual(b2b.incrementBreaches([line(7)]), [
      { variantId: "47591719436510", quantity: 7, increment: 5, allowed: 5 },
    ]);

    // Below the minimum is B2Bridge's own BELOW_MINIMUM, and raising the
    // quantity fixes both. Reported once, not twice.
    assert.deepEqual(b2b.incrementBreaches([line(3)]), []);

    // No rule, or a step of one, means there is no increment to break. Every
    // variant on this store read increment: 1 before the rule was changed, so
    // this is the common case rather than an edge.
    assert.deepEqual(b2b.incrementBreaches([line(12, { increment: 1 })]), []);
    assert.deepEqual(b2b.incrementBreaches([line(12, { hasRule: false })]), []);

    // A GID in, a bare id out — the cart looks lines up by the bare one.
    assert.deepEqual(
      b2b.incrementBreaches([
        line(12, { variantId: "gid://shopify/ProductVariant/47591719436510" }),
      ])[0].variantId,
      "47591719436510",
    );
  });

  test("a typed quantity snaps down, never up past what was asked for", () => {
    // Rounding up would bill for units the buyer never asked for.
    assert.equal(b2b.allowedQuantity(12, 5, 5), 10);
    assert.equal(b2b.allowedQuantity(14, 5, 5), 10);
    assert.equal(b2b.allowedQuantity(15, 5, 5), 15);

    // Under the minimum there is nothing below to round to, so it goes up.
    assert.equal(b2b.allowedQuantity(3, 5, 5), 5);
    assert.equal(b2b.allowedQuantity(1, 5, 5), 5);

    // A minimum that is not a multiple starts at the first one that is.
    assert.equal(b2b.allowedQuantity(8, 5, 7), 10);
    assert.equal(b2b.allowedQuantity(20, 5, 7), 20);

    // No minimum set: the first allowed quantity is one full increment.
    assert.equal(b2b.allowedQuantity(3, 5, null), 5);
    assert.equal(b2b.allowedQuantity(3, 5, 0), 5);

    // A step of one allows anything at or above the minimum.
    assert.equal(b2b.allowedQuantity(7, 1, 1), 7);
    assert.equal(b2b.allowedQuantity(7, 0, 1), 7);
  });

  test("both quantity rules bind, so the stricter side of each wins", () => {
    // Shopify's shape on the left, B2Bridge's on the right. Measured defaults:
    // contextualPricing for both of the test company's locations returns
    // { minimum: 1, maximum: null, increment: 1 } with originType RELATIVE,
    // meaning nothing is configured there, while B2Bridge's rule 8985 sets
    // minimum 5 and increment 5 on the same variant.
    assert.deepEqual(
      b2b.strictestRule(
        { minimum: 1, maximum: null, increment: 1 },
        { minimum: 5, maximum: null, increment: 5 },
      ),
      { minimum: 5, maximum: null, increment: 5 },
    );

    // A maximum set in Shopify admin is not dropped just because B2Bridge
    // priced the line — B2Bridge reports no maximum for this variant, and
    // Shopify enforces its own at checkout either way.
    assert.deepEqual(
      b2b.strictestRule(
        { minimum: 1, maximum: 50, increment: 1 },
        { minimum: 5, maximum: null, increment: 5 },
      ),
      { minimum: 5, maximum: 50, increment: 5 },
    );

    // Both set: the lower maximum and the higher minimum.
    assert.deepEqual(
      b2b.strictestRule(
        { minimum: 2, maximum: 40, increment: 1 },
        { minimum: 5, maximum: 100, increment: 1 },
      ),
      { minimum: 5, maximum: 40, increment: 1 },
    );

    // Two increments: a quantity has to sit on both steps, so multiples of 10.
    assert.deepEqual(
      b2b.strictestRule({ increment: 2 }, { increment: 5 }).increment,
      10,
    );
    // One a multiple of the other collapses to the larger.
    assert.deepEqual(
      b2b.strictestRule({ increment: 5 }, { increment: 10 }).increment,
      10,
    );

    // Missing, null and zero all mean "no rule", not "a rule of zero".
    assert.deepEqual(b2b.strictestRule(null, null), {
      minimum: 1,
      maximum: null,
      increment: 1,
    });
    assert.deepEqual(
      b2b.strictestRule({ minimum: 0, maximum: 0, increment: 0 }, undefined),
      { minimum: 1, maximum: null, increment: 1 },
    );
  });
}

// --- Live probe ---------------------------------------------------------------

function readEnv(name) {
  const line = readFileSync(path.join(ROOT, ".env"), "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  return line
    ? line
        .slice(name.length + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
    : null;
}

async function call(pathname, params, key) {
  const url = new URL(HOST + pathname);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, { headers: { "x-b2bridge-api-key": key } });
  const body = await res.json();
  // Auth failures come back as HTTP 200 with no `success` field, so the status
  // is not usable as a signal.
  if (body?.success !== true) {
    throw new Error(`${pathname} → ${body?.message ?? res.status}`);
  }
  return body;
}

if (LIVE) {
  const key = readEnv("HEADLESS_B2B_TOKEN");
  const domain = readEnv("PUBLIC_STORE_DOMAIN");
  if (!(key && domain)) {
    console.error(
      "HEADLESS_B2B_TOKEN or PUBLIC_STORE_DOMAIN missing from .env",
    );
    process.exit(1);
  }
  console.log(`shop ${domain}\n`);

  const { groups } = await call(
    "/api/v1/customer-groups/get-by-domain",
    { domain },
    key,
  );
  console.log(`customer groups: ${groups.length}`);
  for (const raw of groups) {
    const g = b2b.normalizeGroup(raw);
    console.log(
      `  #${g.id} ${g.name} — tag ${g.customerTag ?? "—"}, ${g.customerIds.length} customer(s), rules [${g.pricingRuleIds}]`,
    );
  }
  if (groups.length === 0) {
    console.log(
      "  (none — create one in the B2Bridge dashboard and assign a customer,",
    );
    console.log("   otherwise nothing links a buyer to a price list)");
  }

  const { rules } = await call(
    "/api/v1/pricing-lists/get-by-domain",
    { domain },
    key,
  );
  console.log(`\nprice list rules: ${rules.length}`);
  for (const r of rules) {
    console.log(
      `  #${r.id} ${r.name} — ${r.discountType} ${r.discountValue}, ${r.totalProducts} product(s)`,
    );
  }

  const matched = CUSTOMER_ARG
    ? b2b.matchGroups(groups.map(b2b.normalizeGroup), CUSTOMER_ARG)
    : [];
  const ruleIds = CUSTOMER_ARG
    ? b2b.ruleIdsForGroups(matched)
    : rules.map((r) => r.id);
  if (CUSTOMER_ARG) {
    console.log(
      `\ncustomer ${CUSTOMER_ARG} → ${matched.length} group(s) → rules [${ruleIds}]`,
    );
    if (ruleIds.length === 0) {
      console.log("  no rules: this buyer would see Shopify's own price");
    }
  }

  for (const id of ruleIds) {
    const { rule: raw } = await call(
      "/api/v1/pricing-lists/get-by-id",
      { domain, id: String(id) },
      key,
    );
    const rule = b2b.normalizeRule(raw);
    console.log(`\nrule #${rule.id} "${rule.name}"`);
    console.log(
      `  active ${b2b.ruleIsActive(rule)} | markets ${rule.marketConditionType} ${rule.appliedCountries.join(",") || "—"}`,
    );
    console.log(
      `  ${rule.discountType} ${rule.discountValue} ${rule.discountDirection} | volume ${rule.volumeType}/${rule.volumeApply}`,
    );
    if (!b2b.volumeIsRepresentable(rule)) {
      console.log(
        "  ⚠ this volume shape has no Shopify equivalent — overlay skipped",
      );
    }
    for (const country of ["CA", "US"]) {
      const applies = b2b.marketApplies(rule, country);
      const overlays = applies ? b2b.overlaysForRule(rule, "USD") : new Map();
      console.log(
        `  ${country}: ${applies ? `${overlays.size} variant(s) priced` : "rule does not apply"}`,
      );
      for (const [variantId, o] of [...overlays].slice(0, 3)) {
        const tiers = o.quantityPriceBreaks.nodes
          .map((n) => `${n.minimumQuantity}+ ${n.price.amount}`)
          .join("  ");
        console.log(`    ${variantId}  base ${o.price.amount}  ${tiers}`);
      }
      if (overlays.size > 3) {
        console.log(`    … ${overlays.size - 3} more`);
      }
    }
  }
}
