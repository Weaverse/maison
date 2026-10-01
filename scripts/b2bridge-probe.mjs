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
 * The fixtures below are verbatim captures from
 * `maison-plus-2.myshopify.com`, rule 8985, on 2026-09-28.
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
    ["normalize", "pricing", "apply", "buyer"]
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
    minimum: 0,
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
  limit_type: "NO_LIMIT",
  limit_apply: "EVERY_PRODUCT",
  minimum: "0",
  maximum: "0",
  increment_quantity: 0,
  start_date: "2026-09-28 04:30:33.269",
  end_date: null,
  enable_end_date: 0,
  pricingListVariants: [
    rawVariant("47591719436510", 325),
    rawVariant("47591720878302", 390),
  ],
};

const RAW_GROUP = {
  id: 1,
  name: "cg1",
  customer_tags: "b2b-cus1",
  customer_ids: '["7875968794841","7881979887833"]',
  pricing_rule_ids: "[8985]",
};

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
        [10, "308.75"],
        [20, "292.50"],
      ],
    );

    const king = overlays.get("47591720878302");
    assert.deepEqual(
      king.quantityPriceBreaks.nodes.map((n) => n.price.amount),
      ["370.50", "351.00"],
      "325 * 0.95 is not 308.75 in binary — rounding must be explicit",
    );

    assert.equal(
      queen.quantityRule,
      undefined,
      "limit_type NO_LIMIT sets no rule",
    );
  });

  test("tiers stack on the base discount, matching B2Bridge's own checkout", () => {
    // Measured, not assumed: B2Bridge's draft order for this exact rule sends
    // Shopify `priceOverride: { amount: 299.49 }` for the $325 variant.
    // 325 × 0.97 × 0.95 = 299.4875 ✓   325 × 0.95 = 308.75 ✗
    const rule = b2b.normalizeRule({ ...RAW_RULE_8985, discount_value: "3" });
    const queen = b2b.overlaysForRule(rule, "USD").get("47591719436510");
    assert.equal(queen.price.amount, "315.25", "325 × 0.97");
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
    // B2Bridge sends "2026-09-28 04:30:33.269" with no marker, but the
    // created_at beside it is UTC and only two minutes later — so the dates
    // are UTC spelled without the Z.
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

    assert.equal(b2b.matchGroups([group], "7875968794841").length, 1, "by id");
    assert.equal(
      b2b.matchGroups([group], null, ["b2b-cus1"]).length,
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
      b2b.customerIdFromGid("gid://shopify/Customer/7875968794841"),
      "7875968794841",
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
