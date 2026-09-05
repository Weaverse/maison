/// <reference types="vite/client" />
/// <reference types="@shopify/oxygen-workers-types" />

// Enhance TypeScript's built-in typings.
import "@total-typescript/ts-reset";
import type {
  HydrogenEnv,
  HydrogenSessionData,
  Storefront as StorefrontBase,
} from "@shopify/hydrogen";
import type { WeaverseClient } from "@weaverse/hydrogen";
import type { createHydrogenRouterContext } from "./app/.server/context";
import type { I18nLocale } from "./app/types/locale";

declare global {
  /**
   * A global `process` object is only available during build to access NODE_ENV.
   */
  const process: { env: { NODE_ENV: "production" | "development" } };

  interface Env extends HydrogenEnv {
    // declare additional Env parameter use in the fetch handler and Remix loader context here
    PUBLIC_GOOGLE_GTM_ID: string;
    // Private — server-only. Never prefix with PUBLIC_ or return from loaders.
    JUDGEME_PRIVATE_API_TOKEN: string;
    CUSTOM_COLLECTION_BANNER_METAFIELD: string;
    METAOBJECT_COLORS_TYPE: string;
    METAOBJECT_COLOR_NAME_KEY: string;
    METAOBJECT_COLOR_VALUE_KEY: string;
    // Private — server-only. Never prefix with PUBLIC_ or return from loaders.
    KLAVIYO_PRIVATE_API_TOKEN: string;
    PUBLIC_SHOPIFY_INBOX_SHOP_ID: string;
    WEAVERSE_HOST?: string;
    WEAVERSE_API_KEY: string;
  }
}

declare module "react-router" {
  interface AppLoadContext
    extends Awaited<ReturnType<typeof createHydrogenRouterContext>> {
    // to change context type, change createHydrogenRouterContext() instead
    // Override storefront type to use I18nLocale instead of I18nBase so that
    // pathPrefix / currency / label etc. are visible to consumers of context.
    storefront: Omit<StorefrontBase, "i18n"> & {
      i18n: I18nLocale;
    };
    weaverse: WeaverseClient;
    additionalContext: HydrogenAdditionalContext;
  }

  // TODO: remove this once we've migrated our loaders to `Route.LoaderArgs`
  interface LoaderFunctionArgs {
    context: AppLoadContext;
  }

  // TODO: remove this once we've migrated our loaders to `Route.ActionArgs`
  interface ActionFunctionArgs {
    context: AppLoadContext;
  }

  interface SessionData extends HydrogenSessionData {
    // declare local additions to the Remix session data here
  }
}

declare global {
  interface Window {
    dataLayer: any[];
  }
}
