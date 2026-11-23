import assert from "node:assert/strict";
import test from "node:test";
import { CartForm, useOptimisticCart } from "@shopify/hydrogen";
import React from "react";
import { renderToString } from "react-dom/server";
import { UNSAFE_DataRouterStateContext } from "react-router";
import {
  settlementStale,
  useSettledOptimisticCart,
} from "../app/components/cart/use-settled-cart.ts";

const VARIANT_A = "gid://shopify/ProductVariant/A";
const VARIANT_B = "gid://shopify/ProductVariant/B";
const LINE_A = `line-${VARIANT_A}`;

const variant = (id) => ({
  id,
  title: "Variant",
  product: { handle: "shirt", title: "Shirt" },
});

const line = (variantId, quantity) => ({
  id: `line-${variantId}`,
  merchandise: variant(variantId),
  quantity,
});

const cartFixture = (updatedAt, lines) => ({
  updatedAt,
  id: "gid://shopify/Cart/1",
  totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
  lines: { nodes: lines },
});

// Mirrors what <CartForm action={CartForm.ACTIONS.LinesAdd} inputs={{lines}}>
// submits: one cartFormInput JSON entry.
const addForm = (variantId, quantity) => {
  const formData = new FormData();
  formData.append(
    CartForm.INPUT_NAME,
    JSON.stringify({
      action: CartForm.ACTIONS.LinesAdd,
      inputs: {
        lines: [
          {
            merchandiseId: variantId,
            quantity,
            selectedVariant: variant(variantId),
          },
        ],
      },
    }),
  );
  return formData;
};

const updateForm = (lineId, quantity) => {
  const formData = new FormData();
  formData.append(
    CartForm.INPUT_NAME,
    JSON.stringify({
      action: CartForm.ACTIONS.LinesUpdate,
      inputs: { lines: [{ id: lineId, quantity }] },
    }),
  );
  return formData;
};

const cartFetcher = (state, formData, key = "cart-0") => ({
  key,
  state,
  formData,
  formMethod: "post",
  formAction: "/cart",
});

/**
 * Runs the real hooks under react-router's fetchers context. SSR rendering is
 * a faithful driver here: `useOptimisticCart` is stateless — it derives
 * everything from the cart prop plus the fetchers in context — and the
 * provider below is the same one HydratedRouter feeds it in the browser.
 */
function renderWithFetchers(Component, props, fetchers) {
  const map = new Map(fetchers.map((f) => [f.key, f]));
  renderToString(
    React.createElement(
      UNSAFE_DataRouterStateContext.Provider,
      { value: { fetchers: map } },
      React.createElement(Component, props),
    ),
  );
}

let projected;
function HydrogenCart({ cart }) {
  projected = useOptimisticCart(cart);
  return null;
}
const hydrogenProjection = (cart, fetchers) => {
  renderWithFetchers(HydrogenCart, { cart }, fetchers);
  return projected;
};

let settled;
function SettledCart({ cart }) {
  settled = useSettledOptimisticCart(cart);
  return null;
}
const settledCart = (cart, fetchers) => {
  renderWithFetchers(SettledCart, { cart }, fetchers);
  return settled;
};

const quantityOf = (cart, variantId) =>
  (cart?.lines?.nodes ?? [])
    .filter((l) => l.merchandise?.id === variantId)
    .reduce((sum, l) => sum + (l.quantity ?? 0), 0);

/**
 * Threads the baseline map through a scripted event sequence the same way the
 * hook's ref does across renders, projecting every step through the real
 * hydrogen hook to get the cart a user would see.
 */
function play(steps) {
  const baselines = new Map();
  return steps.map((step) => {
    const stale = settlementStale(baselines, step.fetchers, step.serverCart);
    const hydrogen = hydrogenProjection(step.serverCart, step.fetchers);
    const displayed = stale ? step.serverCart : hydrogen;
    return {
      ...step,
      drop: stale,
      hydrogenQuantityA: quantityOf(hydrogen, VARIANT_A),
      displayedQuantityA: quantityOf(displayed, VARIANT_A),
    };
  });
}

test("repro: drawer reopens while the re-add is still loading", () => {
  // Cart has A(1)+B(1) from the server; the add-A fetcher already ran its
  // action but is still loading. The cart <Await> just remounted the drawer,
  // so the baselines map starts empty and the fetcher is first seen
  // mid-flight — the overlay cannot be trusted.
  const server = cartFixture("2026-11-17T10:00:05Z", [
    line(VARIANT_A, 1),
    line(VARIANT_B, 1),
  ]);
  const fetchers = [cartFetcher("loading", addForm(VARIANT_A, 1))];

  assert.equal(
    quantityOf(hydrogenProjection(server, fetchers), VARIANT_A),
    2,
    "hydrogen alone doubles the line",
  );
  assert.equal(
    quantityOf(settledCart(server, fetchers), VARIANT_A),
    1,
    "settled hook shows the server quantity",
  );
});

test("plain add with the drawer open: overlay kept until the server catches up", () => {
  const before = cartFixture("2026-11-17T10:00:00Z", [line(VARIANT_B, 1)]);
  const after = cartFixture("2026-11-17T10:00:05Z", [
    line(VARIANT_A, 1),
    line(VARIANT_B, 1),
  ]);
  const [s1, s2, s3, s4] = play([
    {
      label: "submitting, server has no A",
      fetchers: [cartFetcher("submitting", addForm(VARIANT_A, 1))],
      serverCart: before,
    },
    {
      label: "loading, loader lagging (server still has no A)",
      fetchers: [cartFetcher("loading", addForm(VARIANT_A, 1))],
      serverCart: before,
    },
    {
      label: "loading, server has A",
      fetchers: [cartFetcher("loading", addForm(VARIANT_A, 1))],
      serverCart: after,
    },
    {
      label: "idle",
      fetchers: [],
      serverCart: after,
    },
  ]);

  assert.equal(s1.drop, false);
  assert.equal(s1.displayedQuantityA, 1, `${s1.label}: optimistic A shows 1`);

  assert.equal(s2.drop, false);
  assert.equal(
    s2.displayedQuantityA,
    1,
    `${s2.label}: optimistic A still correct while the loader lags`,
  );

  assert.equal(s3.drop, true, `${s3.label}: revalidation landed, drop overlay`);
  assert.equal(
    s3.hydrogenQuantityA,
    2,
    `${s3.label}: hydrogen alone would double`,
  );
  assert.equal(s3.displayedQuantityA, 1);

  assert.equal(s4.drop, false);
  assert.equal(s4.displayedQuantityA, 1, `${s4.label}: no overlay left`);
});

test("same-second remove-then-add: fingerprint catches what updatedAt cannot", () => {
  const SAME_SECOND = "2026-11-17T10:00:00Z";
  const afterRemove = cartFixture(SAME_SECOND, [line(VARIANT_B, 1)]);
  const afterAdd = cartFixture(SAME_SECOND, [
    line(VARIANT_A, 1),
    line(VARIANT_B, 1),
  ]);
  assert.equal(
    afterRemove.updatedAt,
    afterAdd.updatedAt,
    "fixture must collide on the timestamp like the real repro",
  );

  const [s1, s2] = play([
    {
      label: "submitting right after the remove",
      fetchers: [cartFetcher("submitting", addForm(VARIANT_A, 1))],
      serverCart: afterRemove,
    },
    {
      label: "loading, add landed within the same second",
      fetchers: [cartFetcher("loading", addForm(VARIANT_A, 1))],
      serverCart: afterAdd,
    },
  ]);

  assert.equal(s1.drop, false);
  assert.equal(s1.displayedQuantityA, 1);

  assert.equal(s2.drop, true, `${s2.label}: line fingerprint changed`);
  assert.equal(s2.hydrogenQuantityA, 2, "hydrogen alone still doubles");
  assert.equal(s2.displayedQuantityA, 1);
});

test("quantity bump 1 -> 2: overlay applied, then replaced by server truth", () => {
  const before = cartFixture("2026-11-17T10:00:00Z", [line(VARIANT_A, 1)]);
  const after = cartFixture("2026-11-17T10:00:05Z", [line(VARIANT_A, 2)]);

  const [s1, s2] = play([
    {
      label: "submitting, server still has A=1",
      fetchers: [cartFetcher("submitting", updateForm(LINE_A, 2))],
      serverCart: before,
    },
    {
      label: "loading, server has A=2",
      fetchers: [cartFetcher("loading", updateForm(LINE_A, 2))],
      serverCart: after,
    },
  ]);

  assert.equal(s1.drop, false);
  assert.equal(s1.displayedQuantityA, 2, `${s1.label}: optimistic bump to 2`);

  assert.equal(s2.drop, true, `${s2.label}: server truth, overlay dropped`);
  assert.equal(s2.displayedQuantityA, 2);
});

test("fresh mount while submitting keeps the optimistic line", () => {
  const before = cartFixture("2026-11-17T10:00:00Z", [line(VARIANT_B, 1)]);
  const displayed = settledCart(before, [
    cartFetcher("submitting", addForm(VARIANT_A, 1)),
  ]);
  assert.equal(quantityOf(displayed, VARIANT_A), 1);
  assert.equal(quantityOf(displayed, VARIANT_B), 1);
  assert.equal(displayed.isOptimistic, true);
});

test("fresh mount mid-loading drops the overlay even when the loader lags", () => {
  // The documented cost of the conservative rule: a drawer opened while the
  // action has returned but the loader has not shows the server cart as-is,
  // so the just-added line is absent until the revalidation lands. An
  // undercount for an instant beats a double count.
  const lagging = cartFixture("2026-11-17T10:00:00Z", [line(VARIANT_B, 1)]);
  const displayed = settledCart(lagging, [
    cartFetcher("loading", addForm(VARIANT_A, 1)),
  ]);
  assert.equal(quantityOf(displayed, VARIANT_A), 0);
  assert.equal(quantityOf(displayed, VARIANT_B), 1);
});

test("the same key submitted again re-takes its baseline", () => {
  // A stepper keyed by line id, pressed twice: the second submission goes out
  // while the first is still `loading`, so the fetcher runs `loading` straight
  // into `submitting` with no idle render in between. Holding the first
  // baseline would compare the second submission against a cart the first one
  // has already changed and drop its overlay for the whole flight — the badge
  // and the totals would sit still until the server answered.
  const atOne = cartFixture("2026-11-17T10:00:00Z", [line(VARIANT_A, 1)]);
  const atTwo = cartFixture("2026-11-17T10:00:05Z", [line(VARIANT_A, 2)]);
  const atThree = cartFixture("2026-11-17T10:00:09Z", [line(VARIANT_A, 3)]);

  const [s1, s2, s3, s4, s5] = play([
    {
      label: "first press submitting, server has A=1",
      fetchers: [cartFetcher("submitting", updateForm(LINE_A, 2))],
      serverCart: atOne,
    },
    {
      label: "first press landed, server has A=2",
      fetchers: [cartFetcher("loading", updateForm(LINE_A, 2))],
      serverCart: atTwo,
    },
    {
      label: "second press submitting on the same key",
      fetchers: [cartFetcher("submitting", updateForm(LINE_A, 3))],
      serverCart: atTwo,
    },
    {
      label: "second press in flight",
      fetchers: [cartFetcher("loading", updateForm(LINE_A, 3))],
      serverCart: atTwo,
    },
    {
      label: "second press landed, server has A=3",
      fetchers: [cartFetcher("loading", updateForm(LINE_A, 3))],
      serverCart: atThree,
    },
  ]);

  assert.equal(s1.drop, false);
  assert.equal(s1.displayedQuantityA, 2);

  assert.equal(s2.drop, true, `${s2.label}: server caught up`);
  assert.equal(s2.displayedQuantityA, 2);

  // The baseline is re-taken here, so the second press is measured against
  // the cart it actually started from.
  assert.equal(s3.drop, false, `${s3.label}: fresh baseline`);
  assert.equal(s3.displayedQuantityA, 3, `${s3.label}: the press is answered`);

  assert.equal(
    s4.drop,
    false,
    `${s4.label}: cart unchanged since the baseline`,
  );
  assert.equal(s4.displayedQuantityA, 3);

  // Carried through the same sequence rather than replayed on a fresh map, so
  // the baseline this step is measured against is the one the four steps
  // before it left behind.
  assert.equal(s5.drop, true, `${s5.label}: server caught up again`);
  assert.equal(s5.displayedQuantityA, 3);
});
