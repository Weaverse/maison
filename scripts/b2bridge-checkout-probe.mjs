#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = mkdtempSync(path.join(tmpdir(), "b2bridge-checkout-"));
const OUT = path.join(DIR, "bundle.mjs");

await build({
  stdin: {
    contents: [
      `export * as state from "${ROOT}/app/utils/b2bridge/cart-state.server.ts";`,
      `export * as drafts from "${ROOT}/app/utils/b2bridge/draft-order.server.ts";`,
      `export * as checkout from "${ROOT}/app/utils/b2bridge/cart.server.ts";`,
      `export * as checkoutResult from "${ROOT}/app/components/cart/checkout-result.ts";`,
    ].join("\n"),
    resolveDir: ROOT,
    loader: "ts",
  },
  outfile: OUT,
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  plugins: [
    {
      name: "controlled-network",
      setup(plugin) {
        plugin.onResolve(
          { filter: /^\.\/(client|headless|draft-order)\.server$/ },
          (args) => {
            if (!args.importer.endsWith("cart.server.ts")) {
              return null;
            }
            return { path: args.path, namespace: "controlled" };
          },
        );
        plugin.onLoad({ filter: /.*/, namespace: "controlled" }, (args) => {
          if (args.path === "./client.server") {
            return {
              contents: `export const devCustomerIdOverride = (env) => env.TEST_CUSTOMER_ID;
                export const customerIdFromGid = (id) => id;`,
              loader: "js",
            };
          }
          if (args.path === "./headless.server") {
            return {
              contents: `export const isHeadlessConfigured = () => true;
                export const fetchCartPricing = (...args) => globalThis.testPricing(...args);
                export const fetchCheckout = (...args) => globalThis.testCheckout(...args);`,
              loader: "js",
            };
          }
          return {
            contents: `export const findOpenDraftForCart = (...args) => globalThis.testFindDraft(...args);`,
            loader: "js",
          };
        });
      },
    },
  ],
});

const { state, drafts, checkout, checkoutResult } = await import(
  pathToFileURL(OUT).href
);
process.on("exit", function removeBundle() {
  rmSync(DIR, { recursive: true, force: true });
});

function makeContext(options = {}) {
  const cart = {
    id: options.id ?? "gid://shopify/Cart/test",
    attributes: options.attributes ?? [],
    lines: {
      nodes: options.lines ?? [
        {
          id: "line-1",
          merchandise: { id: "gid://shopify/ProductVariant/123" },
          quantity: 10,
          attributes: [],
          sellingPlanAllocation: null,
        },
      ],
    },
  };
  let mutation = options.mutation;
  return {
    env: {
      TEST_CUSTOMER_ID: "456",
      PUBLIC_STORE_DOMAIN: "test.myshopify.com",
      WEAVERSE_HOST: "https://admin.test",
      WEAVERSE_API_KEY: "test-key",
    },
    cart: {
      getCartId() {
        return cart.id;
      },
      async get() {
        return structuredClone(cart);
      },
      async updateAttributes(attributes) {
        if (mutation) {
          return mutation(attributes, cart);
        }
        cart.attributes = attributes;
        return { cart: structuredClone(cart), userErrors: [], errors: [] };
      },
    },
    storefront: {
      CacheLong() {
        return {};
      },
      async query() {
        return {
          localization: {
            market: { id: "gid://shopify/Market/1" },
            country: { isoCode: "CA" },
          },
        };
      },
    },
    customerAccount: {},
    testCart: cart,
  };
}

function mockNetwork() {
  let checkouts = 0;
  globalThis.testPricing = async (_env, request) => ({
    kind: "ok",
    data: {
      canCheckout: true,
      lines: request.lines.map((line) => ({
        ...line,
        increment: 1,
        minimum: 5,
        hasRule: true,
      })),
    },
  });
  globalThis.testCheckout = async () => {
    checkouts += 1;
    return {
      kind: "ok",
      data: {
        draftOrderId: `gid://shopify/DraftOrder/${checkouts}`,
        invoiceUrl: `https://shopify.test/invoice/${checkouts}`,
        subtotal: 2600,
        currency: "USD",
      },
    };
  };
  globalThis.testFindDraft = async () => ({ kind: "missing" });
  return { count: () => checkouts };
}

test("checkout replies belong to the cart at submit time, not reply time", () => {
  const cartA = "/api/b2b-cart-pricing|buyer#A:4";
  const cartB = "/api/b2b-cart-pricing|buyer#B:10";
  // Both carts total 100; a subtotal comparison would silently redirect B to
  // A's invoice. The reply arrives only after the buyer has changed carts.
  const invoiceA = {
    status: "ok",
    invoiceUrl: "https://shopify.test/invoice/A",
    subtotal: 100,
    currency: "USD",
  };
  const invoiceB = {
    ...invoiceA,
    invoiceUrl: "https://shopify.test/invoice/B",
  };
  let tracker = checkoutResult.beginCheckout(cartA, undefined);
  function resultFor(key, data) {
    const checked = checkoutResult.checkoutResultForCart(tracker, key, data);
    tracker = checked.tracker;
    return checked.result;
  }

  assert.equal(resultFor(cartB, undefined), undefined);
  assert.equal(resultFor(cartB, invoiceA), undefined);
  assert.equal(
    resultFor(cartA, invoiceA),
    undefined,
    "the old invoice cannot revive",
  );

  tracker = checkoutResult.beginCheckout(cartB, invoiceA);
  assert.equal(
    resultFor(cartB, invoiceA),
    undefined,
    "the old fetcher data is ignored",
  );
  assert.equal(resultFor(cartB, invoiceB), invoiceB);
  assert.equal(resultFor(`${cartB}-other-buyer`, invoiceB), undefined);
  assert.equal(resultFor(cartB, invoiceB), undefined);
});

test("a prior fetcher response is ignored without this mount submitting", () => {
  const cartKey = "/api/b2b-cart-pricing|buyer#A:4";
  const previousInvoice = {
    status: "ok",
    invoiceUrl: "https://shopify.test/invoice/old",
    subtotal: 100,
    currency: "USD",
  };
  const tracker = {
    cartKey,
    submittedKey: null,
    previousData: undefined,
    invalidated: false,
  };
  assert.equal(
    checkoutResult.checkoutResultForCart(tracker, cartKey, previousInvoice)
      .result,
    undefined,
  );
});

test("cart attribute writes preserve other keys and verify the returned value", async () => {
  const context = makeContext({
    attributes: [{ key: "other-app", value: "keep" }],
  });
  await state.writeCartAttributes(context, { b2b_invoices: "[]" });
  assert.deepEqual(context.testCart.attributes, [
    { key: "other-app", value: "keep" },
    { key: "b2b_invoices", value: "[]" },
  ]);
  await state.writeCartAttributes(context, { b2b_invoices: null });
  assert.deepEqual(context.testCart.attributes, [
    { key: "other-app", value: "keep" },
  ]);
});

test("cart attribute errors, absent cart, and unpersisted values all fail closed", async () => {
  for (const mutation of [
    async (_attributes, cart) => ({ cart, userErrors: [{ message: "no" }] }),
    async () => ({ cart: null }),
    async (_attributes, cart) => ({ cart }),
  ]) {
    const context = makeContext({ mutation });
    await assert.rejects(
      state.writeCartAttributes(context, { attempt: "new" }),
    );
  }
});

test("an update that drops another app's cart attribute is detected", async () => {
  const context = makeContext({
    attributes: [{ key: "other-app", value: "keep" }],
    mutation: async (attributes, cart) => ({
      cart: {
        ...cart,
        attributes: attributes.filter((item) => item.key !== "other-app"),
      },
      userErrors: [],
    }),
  });
  await assert.rejects(
    state.writeCartAttributes(context, { b2b_invoices: "[]" }),
  );
});

test("same-cart tasks serialize and a failed task releases the lock", async () => {
  const context = makeContext();
  const order = [];
  let releaseFirst;
  const gate = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const first = state.withCartMutationLock(context, async () => {
    order.push("first-start");
    await gate;
    order.push("first-end");
    throw new Error("expected");
  });
  const second = state.withCartMutationLock(context, async () => {
    order.push("second");
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(order, ["first-start"]);
  releaseFirst();
  await assert.rejects(first);
  await second;
  assert.deepEqual(order, ["first-start", "first-end", "second"]);
});

test("checkout refuses unsupported line data before reaching B2Bridge", async () => {
  const network = mockNetwork();
  for (const field of [
    { attributes: [{ key: "engraving", value: "A" }] },
    { sellingPlanAllocation: { sellingPlan: { id: "plan-1" } } },
  ]) {
    const context = makeContext();
    Object.assign(context.testCart.lines.nodes[0], field);
    assert.deepEqual(await checkout.createCheckout(context), {
      status: "unavailable",
      retryable: false,
    });
  }
  assert.equal(network.count(), 0);
});

test("a refused attempt write never calls B2Bridge checkout", async () => {
  const network = mockNetwork();
  const context = makeContext({
    mutation: async (_attributes, cart) => ({
      cart,
      userErrors: [{ message: "write refused" }],
    }),
  });
  assert.deepEqual(await checkout.createCheckout(context), {
    status: "unavailable",
    retryable: false,
  });
  assert.equal(network.count(), 0);
});

test("two simultaneous checkouts for one cart create only one draft in this process", async () => {
  const network = mockNetwork();
  const context = makeContext();
  const [first, second] = await Promise.all([
    checkout.createCheckout(context),
    checkout.createCheckout(context),
  ]);
  assert.equal(first.status, "ok");
  assert.deepEqual(second, first);
  assert.equal(network.count(), 1);
});

test("a second cart fingerprint keeps the first pending invoice", async () => {
  mockNetwork();
  const context = makeContext();
  assert.equal((await checkout.createCheckout(context)).status, "ok");
  context.testCart.lines.nodes[0].quantity = 11;
  assert.equal((await checkout.createCheckout(context)).status, "ok");
  assert.equal(checkout.marksFromCart(context.testCart).length, 2);
  const [first, second] = checkout.marksFromCart(context.testCart);
  await checkout.clearCheckoutMark(context, first.draftOrderId);
  assert.deepEqual(
    checkout.marksFromCart(context.testCart).map((mark) => mark.draftOrderId),
    [second.draftOrderId],
  );
});

test("an unreadable Shopify lookup never resubmits a lost checkout", async () => {
  const network = mockNetwork();
  const context = makeContext();
  globalThis.testCheckout = async () => {
    return {
      kind: "failed",
      failure: { action: "BLOCK", status: 0, code: null },
    };
  };
  assert.deepEqual(await checkout.createCheckout(context), {
    status: "unavailable",
    retryable: false,
  });
  const attempt = checkout.attemptFromCart(context.testCart);
  assert.ok(attempt);
  const saved = context.testCart.attributes.find(
    (item) => item.key === "b2b_checkout_attempt",
  );
  saved.value = JSON.stringify({ ...attempt, at: Date.now() - 120_000 });
  globalThis.testFindDraft = async () => ({ kind: "unreadable" });
  assert.deepEqual(await checkout.createCheckout(context), {
    status: "unavailable",
    retryable: false,
  });
  assert.equal(network.count(), 0);
});

test("a found draft recovers a lost reply without creating another", async () => {
  const network = mockNetwork();
  const context = makeContext();
  globalThis.testCheckout = async () => ({
    kind: "failed",
    failure: { action: "BLOCK", status: 0, code: null },
  });
  assert.equal((await checkout.createCheckout(context)).status, "unavailable");
  globalThis.testFindDraft = async () => ({
    kind: "found",
    draft: {
      draftOrderId: "recovered-draft",
      invoiceUrl: "https://shopify.test/recovered",
      status: "OPEN",
      subtotal: 2600,
      currency: "USD",
    },
  });
  const result = await checkout.createCheckout(context);
  assert.equal(result.status, "ok");
  assert.equal(result.invoiceUrl, "https://shopify.test/recovered");
  assert.equal(checkout.marksFromCart(context.testCart).length, 1);
  assert.equal(checkout.attemptFromCart(context.testCart), null);
  assert.equal(network.count(), 0);
});

test("a paid draft from a lost reply is queued for settlement, never repaid", async () => {
  const network = mockNetwork();
  const context = makeContext();
  globalThis.testCheckout = async () => ({
    kind: "failed",
    failure: { action: "BLOCK", status: 0, code: null },
  });
  await checkout.createCheckout(context);
  globalThis.testFindDraft = async () => ({
    kind: "found",
    draft: {
      draftOrderId: "paid-draft",
      invoiceUrl: "https://shopify.test/paid",
      status: "COMPLETED",
      subtotal: 2600,
      currency: "USD",
    },
  });
  assert.deepEqual(await checkout.createCheckout(context), {
    status: "unavailable",
    retryable: false,
  });
  assert.equal(
    checkout.marksFromCart(context.testCart)[0].draftOrderId,
    "paid-draft",
  );
  assert.equal(checkout.marksFromCart(context.testCart)[0].invoiceUrl, "");
  assert.equal(checkout.attemptFromCart(context.testCart), null);
  assert.equal((await checkout.createCheckout(context)).status, "unavailable");
  assert.equal(network.count(), 0);
});

test("a complete negative lookup permits a new attempt only after the reuse window", async () => {
  mockNetwork();
  const context = makeContext();
  globalThis.testCheckout = async () => ({
    kind: "failed",
    failure: { action: "BLOCK", status: 0, code: null },
  });
  await checkout.createCheckout(context);
  assert.equal((await checkout.createCheckout(context)).status, "unavailable");
  const saved = context.testCart.attributes.find(
    (item) => item.key === "b2b_checkout_attempt",
  );
  const attempt = JSON.parse(saved.value);
  saved.value = JSON.stringify({ ...attempt, at: Date.now() - 120_000 });
  let newCalls = 0;
  globalThis.testCheckout = async () => {
    newCalls += 1;
    return {
      kind: "ok",
      data: {
        draftOrderId: "new-draft",
        invoiceUrl: "https://shopify.test/new",
        subtotal: 2600,
        currency: "USD",
      },
    };
  };
  assert.equal((await checkout.createCheckout(context)).status, "ok");
  assert.equal(newCalls, 1);
  assert.equal(
    checkout.marksFromCart(context.testCart)[0].draftOrderId,
    "new-draft",
  );
});

test("a failed invoice-mark write leaves the attempt available for recovery", async () => {
  mockNetwork();
  let writes = 0;
  const context = makeContext({
    mutation: async (attributes, cart) => {
      writes += 1;
      if (writes === 2) {
        return { cart, userErrors: [{ message: "refused mark" }] };
      }
      cart.attributes = attributes;
      return { cart: structuredClone(cart), userErrors: [] };
    },
  });
  assert.equal((await checkout.createCheckout(context)).status, "unavailable");
  assert.ok(checkout.attemptFromCart(context.testCart));
  assert.equal(checkout.marksFromCart(context.testCart).length, 0);
  globalThis.testFindDraft = async () => ({
    kind: "found",
    draft: {
      draftOrderId: "recovered-draft",
      invoiceUrl: "https://shopify.test/recovered",
      status: "OPEN",
      subtotal: 2600,
      currency: "USD",
    },
  });
  assert.equal((await checkout.createCheckout(context)).status, "ok");
  assert.equal(checkout.marksFromCart(context.testCart).length, 1);
});

test("the open-draft search checks every page before declaring missing", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const now = Date.now();
  globalThis.fetch = async (_url, init) => {
    const { variables } = JSON.parse(init.body);
    calls.push(variables.after);
    const found = variables.after === "page-1";
    return {
      ok: true,
      async json() {
        return {
          draftOrders: {
            nodes: [
              {
                id: found ? "draft-1" : "other-draft",
                invoiceUrl: "https://shopify.test/invoice",
                status: "OPEN",
                createdAt: new Date(now).toISOString(),
                subtotalPrice: "2600",
                currencyCode: "USD",
                lineItems: {
                  nodes: [{ quantity: found ? 10 : 9, variant: { id: "123" } }],
                  pageInfo: { hasNextPage: false },
                },
              },
            ],
            pageInfo: {
              hasNextPage: !found,
              endCursor: found ? null : "page-1",
            },
          },
        };
      },
    };
  };
  try {
    const result = await drafts.findOpenDraftForCart(
      makeContext(),
      "456",
      [{ variantId: "123", quantity: 10 }],
      now - 1000,
    );
    assert.equal(result.kind, "found");
    assert.equal(result.draft.draftOrderId, "draft-1");
    assert.deepEqual(calls, [null, "page-1"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("two matching drafts are ambiguous and cannot be adopted", async () => {
  const originalFetch = globalThis.fetch;
  const now = Date.now();
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        draftOrders: {
          nodes: ["draft-1", "draft-2"].map((id) => ({
            id,
            invoiceUrl: `https://shopify.test/${id}`,
            status: "OPEN",
            subtotalPrice: "2600",
            currencyCode: "USD",
            createdAt: new Date(now).toISOString(),
            lineItems: {
              nodes: [{ quantity: 10, variant: { id: "123" } }],
              pageInfo: { hasNextPage: false },
            },
          })),
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      };
    },
  });
  try {
    assert.deepEqual(
      await drafts.findOpenDraftForCart(
        makeContext(),
        "456",
        [{ variantId: "123", quantity: 10 }],
        now,
      ),
      { kind: "unreadable" },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Admin errors and incomplete pagination are unreadable, not missing", async () => {
  const originalFetch = globalThis.fetch;
  const context = makeContext();
  try {
    for (const body of [
      { errors: [{ message: "access denied" }] },
      {
        draftOrders: {
          nodes: [],
          pageInfo: { hasNextPage: true, endCursor: null },
        },
      },
    ]) {
      globalThis.fetch = async () => ({ ok: true, json: async () => body });
      assert.deepEqual(
        await drafts.findOpenDraftForCart(
          context,
          "456",
          [{ variantId: "123", quantity: 10 }],
          Date.now(),
        ),
        { kind: "unreadable" },
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a complete empty Admin search is a definite miss", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        draftOrders: {
          nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      };
    },
  });
  try {
    assert.deepEqual(
      await drafts.findOpenDraftForCart(
        makeContext(),
        "456",
        [{ variantId: "123", quantity: 10 }],
        Date.now(),
      ),
      { kind: "missing" },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
