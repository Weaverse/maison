import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { loadCartPricing } from "~/utils/b2bridge/cart.server";

/**
 * B2Bridge prices for the cart the request's session already holds.
 *
 * The browser sends nothing: lines, quantities and buyer all come from the
 * server's own view of the session, so there is no way to ask for a price
 * against someone else's cart or someone else's identity.
 *
 * Never cached. These prices belong to one buyer.
 */
export async function loader({ context, request }: LoaderFunctionArgs) {
  const path = new URL(request.url).pathname.replace(/\.data$/, "");
  const pricing = await loadCartPricing(context, path);

  return data(pricing, {
    headers: { "Cache-Control": "no-store" },
  });
}
