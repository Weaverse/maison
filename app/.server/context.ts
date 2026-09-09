import type { HydrogenSession } from "@shopify/hydrogen";
import { createHydrogenContext } from "@shopify/hydrogen";
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

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: getRequestI18n(request),
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
        mutateFragment: CART_MUTATION_FRAGMENT,
      },
      customerAccount: {
        useCustomAuthDomain: true,
      },
    },
    additionalContext,
  );

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

  // Add weaverse directly to the hydrogenContext instance
  // This preserves the RouterContextProvider class instance
  Object.assign(hydrogenContext, { weaverse, localization });

  return hydrogenContext;
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
