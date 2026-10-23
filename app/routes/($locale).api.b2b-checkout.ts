import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { createCheckout } from "~/utils/b2bridge/cart.server";

/**
 * Creates the B2B draft order for the cart in this request's session and
 * answers with the invoice to pay it.
 *
 * A POST, and only a POST: this is not a read. Every call creates a draft
 * order in the merchant's admin that cannot be deleted, so it must never be
 * reachable by a prefetch, a link crawler or a browser restoring a page.
 *
 * Like the pricing route, the browser sends nothing — the cart and the buyer
 * both come from the session.
 */
export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data(
      { status: "unavailable", retryable: false },
      { status: 405, headers: { Allow: "POST" } },
    );
  }

  const result = await createCheckout(context);

  // The cart is deliberately left alone. Whether these lines should go depends
  // on whether the invoice gets paid, and that happens on Shopify's own domain
  // where this storefront sees nothing — so it is settled when the buyer comes
  // back, against the draft order's real status. Clearing here would punish
  // everyone who changes their mind at the payment page.
  return data(result, { headers: { "Cache-Control": "no-store" } });
}
