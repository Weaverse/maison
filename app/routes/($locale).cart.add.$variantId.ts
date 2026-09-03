import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { cart } = context;

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
    headers.set("Location", "/cart");

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
