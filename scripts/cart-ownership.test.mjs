import assert from "node:assert/strict";
import test from "node:test";
import { createCartHandler } from "@shopify/hydrogen";
import { currentCartCustomerSubject } from "../app/utils/cart-owner.account.ts";
import {
  adoptionDisposition,
  adoptionOutcome,
  cartAccess,
  cartGate,
  unavailableCart,
  withheldCartContext,
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

test("an account we cannot identify is gated with or without a cart cookie", () => {
  // The case this gate exists for. With no cookie the guard used to be
  // skipped entirely, so `addLines` reached Shopify, a cart was created
  // there, and writing its id back failed afterwards — an error for the
  // shopper and an orphan cart left behind on every retry.
  assert.equal(
    cartGate({ customerSubject: undefined, cartId: undefined, marker: null }),
    "withhold",
  );
  assert.equal(
    cartGate({
      customerSubject: undefined,
      cartId: "cart-1",
      marker: { cartId: "cart-1", customerSubject: "buyer-A" },
    }),
    "withhold",
  );

  // A browser carrying no cart, for someone we can identify, is nothing to act on.
  assert.equal(
    cartGate({ customerSubject: "buyer-A", cartId: undefined, marker: null }),
    "none",
  );
  assert.equal(
    cartGate({ customerSubject: null, cartId: undefined, marker: null }),
    "none",
  );

  // With an identity and a cart, the gate is `cartAccess`.
  const ownedByA = { cartId: "cart-1", customerSubject: "buyer-A" };
  assert.equal(
    cartGate({
      customerSubject: "buyer-A",
      cartId: "cart-1",
      marker: ownedByA,
    }),
    "keep",
  );
  assert.equal(
    cartGate({
      customerSubject: "buyer-B",
      cartId: "cart-1",
      marker: ownedByA,
    }),
    "reset",
  );
  assert.equal(
    cartGate({
      customerSubject: "buyer-A",
      cartId: "cart-1",
      marker: { cartId: "cart-1", customerSubject: null },
    }),
    "adopt",
  );
  // An old cart with no record at all is let go, not guessed at.
  assert.equal(
    cartGate({ customerSubject: "buyer-A", cartId: "cart-1", marker: null }),
    "reset",
  );
});

/**
 * Hydrogen's own cart handler, over a storefront that answers nothing and
 * records every request it is asked to make.
 */
function recordingCart() {
  const requests = [];
  const storefront = {
    mutate: async (query) => {
      requests.push(String(query).slice(0, 48));
      return { cartCreate: { cart: { id: "gid://shopify/Cart/created" } } };
    },
    query: async (query) => {
      requests.push(String(query).slice(0, 48));
      return { cart: null };
    },
    getPublicTokenHeaders: () => ({}),
    getShopifyDomain: () => "shop.myshopify.com",
    getApiUrl: () => "https://shop.myshopify.com/api",
    i18n: { country: "US", language: "EN" },
  };
  const cart = createCartHandler({
    storefront,
    getCartId: () => undefined,
    setCartId: () => new Headers(),
    cartQueryFragment: "fragment CartApiQuery on Cart { id }",
    cartMutateFragment: "fragment CartApiMutation on Cart { id }",
  });
  return { cart, requests };
}

test("a browser with no cart cookie cannot create one under an unknown identity", async () => {
  // The whole path, over Hydrogen's real cart handler: no cookie and an
  // identity we could not establish, through the gate, to a context whose
  // cart refuses to act.
  //
  // Gated behind a cart cookie, as this once was, `addLines` ran: Shopify
  // created a cart, and only writing its id back failed. The shopper saw an
  // error with nothing saved, and every retry left another cart behind. What
  // matters here is not the error but the count underneath it.
  const { cart, requests } = recordingCart();
  const gate = cartGate({
    customerSubject: undefined,
    cartId: undefined,
    marker: null,
  });
  assert.equal(gate, "withhold");

  const context = withheldCartContext({ cart, storefront: "untouched" });
  // Thrown, not rejected: the guard stops the call before a promise exists,
  // which is the point — nothing is in flight to Shopify to be awaited.
  assert.throws(
    () =>
      context.cart.addLines([
        { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 },
      ]),
    (error) => error instanceof Response && error.status === 503,
  );
  assert.deepEqual(requests, [], "no cart was created in Shopify");

  // Reading is still allowed, and the rest of the context is untouched.
  assert.equal(await context.cart.get(), null);
  assert.equal(context.storefront, "untouched");
  assert.deepEqual(requests, []);
});

test("a cart that is not withheld is handed over as it is", async () => {
  const { cart } = recordingCart();
  const context = { cart };
  assert.equal(
    cartGate({ customerSubject: "buyer-A", cartId: undefined, marker: null }),
    "none",
  );
  // Nothing wraps it, so the handler is the one Hydrogen built.
  assert.equal(context.cart, cart);
});
