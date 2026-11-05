import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { prefixPathWithLocale } from "~/utils/locale";

export async function loader({ params, context }: LoaderFunctionArgs) {
  if (context.cartIdentityUnavailable) {
    throw new Response("Cart identity unavailable", { status: 503 });
  }
  const { cart, storefront } = context;

  try {
    const variantId = params.variantId;

    const inputLines = [
      {
        merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
        quantity: 1,
      },
    ];
    const result = await cart.addLines(inputLines);

    /**
     * The Cart ID may change after each mutation. We need to update it each time in the session.
     */
    const cartId = result.cart.id;
    const headers = cart.setCartId(cartId);
    headers.set("Location", prefixPathWithLocale("/cart", storefront.i18n));

    const { cart: cartResult, errors, userErrors } = result;

    return data(
      {
        cart: cartResult,
        userErrors,
        errors,
      },
      { status: 303, headers },
    );
  } catch (e) {
    console.error(e);
    return data({ error: e });
  }
}
