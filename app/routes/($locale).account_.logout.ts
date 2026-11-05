import {
  type ActionFunction,
  type ActionFunctionArgs,
  type AppLoadContext,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import { EXPIRED_CART_COOKIE } from "~/utils/cart-ownership";

/**
 * The cart id Hydrogen keeps, expired.
 *
 * `cartSetIdDefault` writes the id to a cookie named `cart` at the root path,
 * and nothing about signing out touches it. Detaching the buyer identity below
 * leaves the cart itself with the same lines, so the next person to sign in on
 * this browser could open it and find the previous buyer's lines and `b2b_*`
 * checkout attributes. Expiring the cookie makes the next `add to cart` here
 * start a new cart.
 */
export async function doLogout(context: AppLoadContext) {
  try {
    await context.cart.updateBuyerIdentity({
      companyLocationId: null,
      customerAccessToken: null,
    });
  } catch (error) {
    // A Shopify outage must not keep this browser signed in or retain its cart.
    console.warn("[cart] buyer identity detach failed on logout:", error);
  }

  const response = await context.customerAccount.logout();
  // Appended to a copy rather than to the response: `logout` *sets*
  // `Set-Cookie` to the destroyed session, so a header handed to it through
  // `options.headers` is overwritten rather than kept.
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", EXPIRED_CART_COOKIE);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function loader({ params }: LoaderFunctionArgs) {
  const locale = params.locale;
  return redirect(locale ? `/${locale}` : "/");
}

export const action: ActionFunction = async ({
  context,
}: ActionFunctionArgs) => {
  return doLogout(context);
};
