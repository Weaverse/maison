import * as remixBuild from "virtual:react-router/server-build";
import { storefrontRedirect } from "@shopify/hydrogen";
import { createRequestHandler } from "@shopify/hydrogen/oxygen";
import { createHydrogenRouterContext } from "~/.server/context";
import { EXPIRED_CART_COOKIE } from "~/utils/cart-ownership";
import { getCanonicalLocaleRedirect } from "~/utils/locale";

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      async function finalizeResponse(outgoingResponse: Response) {
        // A rejected cart cookie must expire before any new cart cookie from
        // the route is applied. Keep cart and session cookies separately.
        const routeCookies = outgoingResponse.headers.getSetCookie();
        if (
          hydrogenContext.cartWasReset ||
          hydrogenContext.cartResponseHeaders.has("Set-Cookie")
        ) {
          outgoingResponse.headers.delete("Set-Cookie");
          if (hydrogenContext.cartWasReset) {
            outgoingResponse.headers.append("Set-Cookie", EXPIRED_CART_COOKIE);
          }
          for (const cookie of hydrogenContext.cartResponseHeaders.getSetCookie()) {
            outgoingResponse.headers.append("Set-Cookie", cookie);
          }
          for (const cookie of routeCookies) {
            outgoingResponse.headers.append("Set-Cookie", cookie);
          }
        }

        if (hydrogenContext.session.isPending) {
          outgoingResponse.headers.append(
            "Set-Cookie",
            await hydrogenContext.session.commit(),
          );
        }
        return outgoingResponse;
      }

      // The default locale answers on `/` and on its own prefix. Send the
      // prefixed form to the root so each page has one canonical address.
      const localeRedirect = getCanonicalLocaleRedirect(
        request,
        hydrogenContext.localization,
      );
      if (localeRedirect) {
        // Build against the request's own origin rather than its full URL, so
        // the destination cannot be talked into pointing somewhere else.
        const { origin } = new URL(request.url);
        return finalizeResponse(
          new Response(null, {
            status: 302,
            headers: { Location: String(new URL(localeRedirect, origin)) },
          }),
        );
      }

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      await finalizeResponse(response);

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      console.error(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
};
