import assert from "node:assert/strict";
import test from "node:test";
import { currentCartCustomerSubject } from "../app/utils/cart-owner.account.ts";
import {
  adoptionDisposition,
  adoptionOutcome,
  cartAccess,
  unavailableCart,
} from "../app/utils/cart-ownership.ts";

function idToken(subject) {
  const payload = Buffer.from(JSON.stringify({ sub: subject })).toString(
    "base64url",
  );
  return `header.${payload}.signature`;
}

function session(account) {
  return { get: () => account };
}

test("cart ownership is kept, adopted, or reset by signed subject", () => {
  const guest = { cartId: "cart-1", customerSubject: null };
  const buyer = { cartId: "cart-1", customerSubject: "buyer-A" };
  assert.equal(cartAccess("cart-1", guest, null), "keep");
  assert.equal(cartAccess("cart-1", guest, "buyer-A"), "adopt");
  assert.equal(cartAccess("cart-1", buyer, "buyer-A"), "keep");
  assert.equal(cartAccess("cart-1", buyer, "buyer-B"), "reset");
  assert.equal(cartAccess("cart-1", buyer, null), "reset");
  assert.equal(cartAccess("cart-1", null, "buyer-A"), "reset");
  assert.equal(
    cartAccess("cart-1", { ...buyer, cartId: "other" }, "buyer-A"),
    "reset",
  );
});

test("a token refresh does not change the cart owner", async () => {
  const account = { accessToken: "first", idToken: idToken("buyer-A") };
  const customerAccount = { isLoggedIn: async () => true };
  assert.equal(
    await currentCartCustomerSubject(customerAccount, session(account)),
    "buyer-A",
  );
  account.accessToken = "refreshed";
  assert.equal(
    await currentCartCustomerSubject(customerAccount, session(account)),
    "buyer-A",
  );
});

test("a transient auth failure is unknown, not a guest", async () => {
  const account = { accessToken: "token", idToken: idToken("buyer-A") };
  assert.equal(
    await currentCartCustomerSubject(
      { isLoggedIn: async () => false },
      session(account),
    ),
    undefined,
  );
  assert.equal(
    await currentCartCustomerSubject(
      {
        isLoggedIn: async () => {
          throw new Error("network");
        },
      },
      session(account),
    ),
    undefined,
  );
  assert.equal(
    await currentCartCustomerSubject(
      { isLoggedIn: async () => true },
      session({ accessToken: "token", idToken: "invalid" }),
    ),
    undefined,
  );
  assert.equal(
    await currentCartCustomerSubject(
      { isLoggedIn: async () => true },
      session({ idToken: idToken("buyer-A") }),
    ),
    undefined,
  );
  assert.equal(
    await currentCartCustomerSubject(
      { isLoggedIn: async () => false },
      session(null),
    ),
    null,
  );
});

test("an unavailable cart permits reads but blocks mutations before execution", async () => {
  let mutationCount = 0;
  const cart = unavailableCart({
    get: async () => null,
    getCartId: () => undefined,
    addLines: () => {
      mutationCount += 1;
    },
    updateLines: () => {
      mutationCount += 1;
    },
  });
  assert.equal(await cart.get(), null);
  assert.equal(cart.getCartId(), undefined);
  for (const mutate of [cart.addLines, cart.updateLines]) {
    assert.throws(
      mutate,
      (error) => error instanceof Response && error.status === 503,
    );
  }
  assert.equal(mutationCount, 0);
});

test("a guest cart survives a Shopify that could not be reached", () => {
  // Shopify answered about this cart: it cannot be handed over, so there is
  // nothing to keep.
  assert.equal(
    adoptionOutcome({
      cart: { id: "cart-1" },
      userErrors: [{ message: "no" }],
    }),
    "refused",
  );

  // Shopify did not answer. None of these say anything about the cart, so the
  // shopper keeps it and the next request tries again.
  assert.equal(adoptionOutcome(null, new Error("503")), "unreachable");
  assert.equal(adoptionOutcome(null), "unreachable");
  assert.equal(adoptionOutcome({ cart: null }), "unreachable");
  assert.equal(
    adoptionOutcome({
      cart: { id: "cart-1" },
      errors: [{ message: "timeout" }],
    }),
    "unreachable",
  );

  assert.equal(adoptionOutcome({ cart: { id: "cart-1" } }), "adopted");
});

test("signing in as somebody else gives the cart up", () => {
  const ownedByA = { cartId: "cart-1", customerSubject: "buyer-A" };
  assert.equal(cartAccess("cart-1", ownedByA, "buyer-B"), "reset");
  assert.equal(cartAccess("cart-1", ownedByA, null), "reset");
  // A cart recorded against a different cart id is not evidence of anything.
  assert.equal(cartAccess("cart-2", ownedByA, "buyer-A"), "reset");
});

test("an unreachable Shopify never costs the shopper their cart", () => {
  // The line this whole branch exists to hold: not reaching Shopify withholds
  // the cart for one request, and only a refusal gives it up. A later edit
  // that flips this would take the cookie and the signed marker with it, so
  // the mapping is asserted here even though it is barely more than a table.
  assert.equal(adoptionDisposition("unreachable"), "withhold");
  assert.equal(adoptionDisposition("refused"), "release");
  assert.equal(adoptionDisposition("adopted"), "keep");

  // The two together, from Shopify's answer to the verdict on the cart. Not
  // end to end: what `context.ts` then does with that verdict — the cookie it
  // writes, the marker it keeps — is beyond anything this can reach.
  assert.equal(
    adoptionDisposition(adoptionOutcome(null, new Error("503"))),
    "withhold",
  );
  assert.equal(
    adoptionDisposition(
      adoptionOutcome({ cart: { id: "c1" }, userErrors: [{ message: "no" }] }),
    ),
    "release",
  );
});
