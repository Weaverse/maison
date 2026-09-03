import { data, type LoaderFunctionArgs } from "react-router";
import type { FeaturedItemsQuery } from "storefront-api.generated";
import invariant from "tiny-invariant";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";

export async function loader({
  context: { storefront, customerAccount },
}: LoaderFunctionArgs) {
  const buyer = await customerAccount.getBuyer();
  const buyerVariables =
    buyer?.companyLocationId && buyer?.customerAccessToken
      ? {
          buyer,
        }
      : {};

  return data(await getFeaturedData(storefront, { ...buyerVariables }));
}

export async function getFeaturedData(
  storefront: LoaderFunctionArgs["context"]["storefront"],
  variables: { pageBy?: number; buyer?: any } = {},
) {
  const featuredItemsData = await storefront.query<FeaturedItemsQuery>(
    FEATURED_ITEMS_QUERY,
    {
      variables: {
        pageBy: 12,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        query: maybeFilterOutCombinedListingsQuery,
        ...variables,
      },
    },
  );

  invariant(
    featuredItemsData,
    "No featured items data returned from Shopify API",
  );

  return featuredItemsData;
}

export type FeaturedData = Awaited<ReturnType<typeof getFeaturedData>>;

const FEATURED_ITEMS_QUERY = `#graphql
  query featuredItems(
    $buyer: BuyerInput
    $country: CountryCode
    $language: LanguageCode
    $pageBy: Int = 12
    $query: String
  ) @inContext(buyer: $buyer, country: $country, language: $language) {
    featuredProducts: products(first: $pageBy, sortKey: BEST_SELLING, query: $query) {
      nodes {
        ...ProductCard
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
` as const;
