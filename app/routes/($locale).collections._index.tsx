import type { SeoConfig } from "@shopify/hydrogen";
import { getPaginationVariables, getSeoMeta } from "@shopify/hydrogen";
import type { RouteLoaderArgs } from "@weaverse/hydrogen";
import type { MetaFunction } from "react-router";
import type { CollectionsQuery } from "storefront-api.generated";
import { routeHeaders } from "~/utils/cache";
import { COLLECTION_PRODUCT_COUNT_LIMIT, PAGINATION_SIZE } from "~/utils/const";
import { seoPayload } from "~/utils/seo.server";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;

export const loader = async (args: RouteLoaderArgs) => {
  const {
    request,
    context: { weaverse },
  } = args;
  const storefront = weaverse.storefront;
  const variables = getPaginationVariables(request, {
    pageBy: PAGINATION_SIZE,
  });

  // Load collections data and weaverseData in parallel
  const [{ collections }, weaverseData] = await Promise.all([
    storefront.query<CollectionsQuery>(COLLECTIONS_QUERY, {
      variables: {
        ...variables,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        productCountLimit: COLLECTION_PRODUCT_COUNT_LIMIT,
      },
    }),
    weaverse.loadPage({
      type: "COLLECTION_LIST",
    }),
  ]);

  const seo = seoPayload.listCollections({
    collections,
    url: request.url,
  });

  return {
    collections,
    seo,
    weaverseData,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return getSeoMeta(data?.seo as SeoConfig);
};

export default function Collections() {
  return <WeaverseContent />;
}

const COLLECTIONS_QUERY = `#graphql
  query collections(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $productCountLimit: Int
  ) @inContext(country: $country, language: $language) {
    collections(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        id
        title
        description
        handle
        seo {
          description
          title
        }
        image {
          id
          url
          width
          height
          altText
        }
        # Two connections on purpose, each selecting only what it needs.
        # Merging them would apply the fallback's field set to every counted
        # node, so the cap could no longer be raised without paying for it.
        productCount: products(first: $productCountLimit) {
          nodes {
            id
          }
          pageInfo {
            hasNextPage
          }
        }
        fallbackProduct: products(first: 1) {
          nodes {
            media(first: 1) {
              nodes {
                previewImage {
                  id
                  url
                  width
                  height
                  altText
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
` as const;
