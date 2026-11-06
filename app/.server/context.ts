import type { HydrogenSession } from "@shopify/hydrogen";
import {
  cartGetIdDefault,
  cartSetIdDefault,
  createHydrogenContext,
} from "@shopify/hydrogen";
import { WeaverseClient } from "@weaverse/hydrogen";
import {
  createCookieSessionStorage,
  type Session,
  type SessionStorage,
} from "react-router";
import {
  CART_MUTATION_FRAGMENT,
  CART_QUERY_FRAGMENT,
} from "~/graphql/cart-fragments";
import {
  type CartCustomerSubject,
  currentCartCustomerSubject,
} from "~/utils/cart-owner.account";
import {
  type CartOwnerMarker,
  cartAccess,
  unavailableCart,
} from "~/utils/cart-ownership";
import {
  getRequestI18n,
  loadStoreLocalization,
} from "~/utils/localization.server";
import { components } from "~/weaverse/components";
import { getThemeSchema } from "~/weaverse/schema.server";

const additionalContext = {} as const;

type AdditionalContext = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContext {}
}

export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  if (!env?.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open("hydrogen"),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  let allowedCartId = cartGetIdDefault(request.headers)();
  let cartWasReset = false;
  let cartHandlerStale = false;
  let cartIdentityUnavailable = false;
  let customerSubject: CartCustomerSubject;
  const cartCookieWriter = cartSetIdDefault();
  const cartResponseHeaders = new Headers();

  function setCartId(cartId: string) {
    if (customerSubject === undefined) {
      throw new Response("Cart identity unavailable", { status: 503 });
    }
    allowedCartId = cartId;
    session.set("cartOwner", {
      cartId,
      customerSubject,
    } satisfies CartOwnerMarker);
    return cartCookieWriter(cartId);
  }

  function makeHydrogenContext() {
    return createHydrogenContext(
      {
        env,
        request,
        cache,
        waitUntil,
        session,
        i18n: getRequestI18n(request),
        cart: {
          getId: () => allowedCartId,
          setId: setCartId,
          queryFragment: CART_QUERY_FRAGMENT,
          mutateFragment: CART_MUTATION_FRAGMENT,
        },
        customerAccount: {
          useCustomAuthDomain: true,
        },
      },
      additionalContext,
    );
  }

  let hydrogenContext = makeHydrogenContext();
  customerSubject = await currentCartCustomerSubject(
    hydrogenContext.customerAccount,
    session,
  );

  function resetCart() {
    allowedCartId = undefined;
    cartWasReset = true;
    cartHandlerStale = true;
    session.unset("cartOwner");
  }

  if (allowedCartId) {
    const marker = session.get("cartOwner") as unknown;
    // Old carts have no signed ownership record. Treat them as unknown rather
    // than guessing that they belong to the next person using this browser.
    if (
      !marker ||
      typeof marker !== "object" ||
      !("cartId" in marker) ||
      marker.cartId !== allowedCartId
    ) {
      resetCart();
    } else if (customerSubject === undefined) {
      // Keep the signed marker and cookie for a later retry, but never expose
      // the cart while the account's identity is uncertain.
      allowedCartId = undefined;
      cartHandlerStale = true;
    } else {
      const access = cartAccess(allowedCartId, marker, customerSubject);
      if (access === "reset") {
        resetCart();
      } else if (access === "adopt") {
        try {
          const buyer = await hydrogenContext.customerAccount.getBuyer();
          if (!buyer?.customerAccessToken) {
            throw new Error("Customer access token unavailable");
          }
          const result = await hydrogenContext.cart.updateBuyerIdentity({
            customerAccessToken: buyer.customerAccessToken,
            companyLocationId: buyer.companyLocationId ?? null,
          });
          if (
            !result.cart?.id ||
            result.errors?.length ||
            result.userErrors?.length
          ) {
            throw new Error("Shopify refused the cart buyer identity update");
          }
          const cartIdChanged = result.cart.id !== allowedCartId;
          const headers = hydrogenContext.cart.setCartId(result.cart.id);
          if (cartIdChanged) {
            cartHandlerStale = true;
            for (const cookie of headers.getSetCookie()) {
              cartResponseHeaders.append("Set-Cookie", cookie);
            }
          }
        } catch (error) {
          console.warn("[cart] guest cart adoption failed:", error);
          resetCart();
        }
      }
    }
  }

  // Hydrogen captures the first cart ID inside createCartHandler. Changing the
  // getId callback's value alone cannot revoke that captured ID.
  if (cartHandlerStale) {
    hydrogenContext = makeHydrogenContext();
  }

  if (customerSubject === undefined) {
    cartIdentityUnavailable = true;
    // Reading the cart returns null because this handler has no allowed ID.
    // Block every mutation before it can create or alter a Shopify cart.
    const guardedCart = unavailableCart(hydrogenContext.cart);
    hydrogenContext = new Proxy(hydrogenContext, {
      get(target, key, receiver) {
        return key === "cart"
          ? guardedCart
          : Reflect.get(target, key, receiver);
      },
    });
  }

  // Shopify Markets decides what is live; the theme decides what it has a
  // catalog for. This needs the Storefront client, so it runs after the
  // context exists rather than inside it.
  const localization = await loadStoreLocalization(
    hydrogenContext.storefront,
    request,
  );

  const weaverse = new WeaverseClient({
    ...hydrogenContext,
    request,
    cache,
    themeSchema: getThemeSchema(localization),
    components,
  });

  // `Object.assign` mutates and returns the same instance, so returning it
  // directly keeps the RouterContextProvider intact while letting the added
  // properties reach the context type.
  return Object.assign(hydrogenContext, {
    weaverse,
    localization,
    get cartWasReset() {
      return cartWasReset;
    },
    cartIdentityUnavailable,
    cartResponseHeaders,
  });
}

class AppSession implements HydrogenSession {
  isPending = false;
  readonly #sessionStorage: SessionStorage;
  readonly #session: Session;

  constructor(sessionStorage: SessionStorage, session: Session) {
    this.#sessionStorage = sessionStorage;
    this.#session = session;
  }

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: "session",
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secrets,
      },
    });

    const session = await storage
      .getSession(request.headers.get("Cookie"))
      .catch(() => storage.getSession());

    return new AppSession(storage, session);
  }

  get has() {
    return this.#session.has;
  }

  get get() {
    return this.#session.get;
  }

  get flash() {
    return this.#session.flash;
  }

  get unset() {
    this.isPending = true;
    return this.#session.unset;
  }

  get set() {
    this.isPending = true;
    return this.#session.set;
  }

  destroy() {
    return this.#sessionStorage.destroySession(this.#session);
  }

  commit() {
    this.isPending = false;
    return this.#sessionStorage.commitSession(this.#session);
  }
}
