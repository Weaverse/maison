import * as remixBuild from "virtual:react-router/server-build";
import { storefrontRedirect } from "@shopify/hydrogen";
import { createRequestHandler } from "@shopify/hydrogen/oxygen";
import { createHydrogenRouterContext } from "~/.server/context";

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

      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          "Set-Cookie",
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
};
