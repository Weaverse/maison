import { flattenConnection } from "@shopify/hydrogen";
import type { ProductSortKeys } from "@shopify/hydrogen/storefront-api-types";
import { data, type LoaderFunctionArgs } from "react-router";
import type { ApiAllProductsQuery } from "storefront-api.generated";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";

/**
 * Fetch a given set of products from the storefront API
 * @param count
 * @param query
 * @param reverse
 * @param sortKey
 * @returns Product[]
 * @see https://shopify.dev/api/storefront/current/queries/products
 */
export async function loader({
  request,
  context: { storefront, customerAccount },
}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const query = searchParams.get("query") ?? "";
  const sortKey =
    (searchParams.get("sortKey") as null | ProductSortKeys) ?? "BEST_SELLING";
  let reverse = false;

  try {
    const _reverse = searchParams.get("reverse");
    if (_reverse === "true") {
      reverse = true;
    }
  } catch (_) {
    // noop
  }

  let count = 4;
  try {
    const _count = searchParams.get("count");
    if (typeof _count === "string") {
      count = Number.parseInt(_count, 10);
    }
  } catch (_) {
    // noop
  }

  let buyer: Awaited<ReturnType<typeof customerAccount.getBuyer>>;
  try {
    buyer = await customerAccount.getBuyer();
  } catch (error) {
    console.error(
      "[api/products] getBuyer failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return data({ products: [] });
  }
  const buyerVariables =
    buyer?.companyLocationId && buyer?.customerAccessToken
      ? {
          buyer,
        }
      : {};
  const hasBuyerContext = Boolean(
    buyer?.companyLocationId && buyer?.customerAccessToken,
  );

  const combinedQuery = [maybeFilterOutCombinedListingsQuery, query]
    .filter(Boolean)
    .join(" ");

  try {
    const result = await storefront.query<ApiAllProductsQuery>(
      API_ALL_PRODUCTS_QUERY,
      {
        variables: {
          count,
          query: combinedQuery,
          reverse,
          sortKey,
          ...buyerVariables,
          country: storefront.i18n.country,
          language: storefront.i18n.language,
        },
        cache: hasBuyerContext
          ? storefront.CacheNone()
          : storefront.CacheLong(),
      },
    );

    if (result.errors?.length) {
      console.error("[api/products] Shopify GraphQL errors:", {
        hasBuyerContext,
        messages: result.errors.map((error) =>
          buyer?.customerAccessToken
            ? error.message.replaceAll(buyer.customerAccessToken, "[redacted]")
            : error.message,
        ),
      });
      return data({ products: [] });
    }

    if (!result.products) {
      console.error("[api/products] Shopify response missing products:", {
        hasBuyerContext,
      });
      return data({ products: [] });
    }

    return data({ products: flattenConnection(result.products) });
  } catch (error) {
    console.error("[api/products] storefront query failed:", {
      hasBuyerContext,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return data({ products: [] });
  }
}

const API_ALL_PRODUCTS_QUERY = `#graphql
  query ApiAllProducts(
    $buyer: BuyerInput
    $query: String
    $count: Int
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
    $sortKey: ProductSortKeys
  ) @inContext(buyer: $buyer, country: $country, language: $language) {
    products(first: $count, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
