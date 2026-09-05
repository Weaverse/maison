import type { LoaderFunction } from "react-router";
import { data } from "react-router";
import type { ProductQuery } from "storefront-api.generated";
import invariant from "tiny-invariant";
import { PRODUCT_QUERY } from "~/graphql/queries";

/**
 * Product API loader — `/api/product/{handle}`
 *
 * Returns product data with B2B pricing. Judge.me reviews live on
 * `/api/product/{handle}/reviews` (`routes/api/reviews.ts`).
 *
 * B2B features:
 * - Includes buyer context for company-specific pricing
 * - Supports volume pricing and quantity rules
 * - Handles company location context for pricing
 */
export const loader: LoaderFunction = async ({ context, params }) => {
  try {
    const { storefront, customerAccount } = context;
    const { productHandle } = params;

    invariant(productHandle, "Missing product handle.");

    let buyer: Awaited<ReturnType<typeof customerAccount.getBuyer>> | null =
      null;
    try {
      buyer = await customerAccount.getBuyer();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[B2B] Failed to get buyer context:", message);
    }

    const buyerVariables =
      buyer?.companyLocationId && buyer?.customerAccessToken ? { buyer } : {};

    const { product, shop } = await storefront.query<ProductQuery>(
      PRODUCT_QUERY,
      {
        variables: {
          handle: productHandle,
          ...buyerVariables,
          selectedOptions: [],
          language: storefront.i18n.language,
          country: storefront.i18n.country,
        },
      },
    );
    return data({
      shop,
      product,
      storeDomain: shop.primaryDomain.url,
      buyer,
    });
  } catch (err) {
    console.error("[Error in product API loader]", err);
    const message = err instanceof Error ? err.message : "Unknown API error";
    return data({ error: message }, { status: 500 });
  }
};
