import {
  type ComponentLoaderArgs,
  createSchema,
  type WeaverseCollection,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import type {
  CollectionProductsQuery,
  FeaturedProductsQuery,
  ProductsByIdsQuery,
} from "storefront-api.generated";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";

interface FeaturedProductsData {
  selectionMethod: "auto" | "collection" | "manual";
  collection?: WeaverseCollection;
  products?: WeaverseProduct[];
  displayType: "grid" | "carousel";
  productsToShow: number;
}

interface FeaturedProductsProps
  extends SectionProps<FeaturedProductsLoaderData>,
    FeaturedProductsData {
  ref: React.Ref<HTMLElement>;
}

import { createContext } from "react";

export const FeaturedProductsContext = createContext<{
  displayType?: "grid" | "carousel";
  productsToShow?: number;
} | null>(null);

export default function FeaturedProducts(props: FeaturedProductsProps) {
  const {
    ref,
    loaderData,
    children,
    displayType,
    productsToShow,
    selectionMethod,
    collection,
    products,
    ...rest
  } = props;
  return (
    <Section ref={ref} {...rest} overflow="unset">
      <FeaturedProductsContext.Provider value={{ displayType, productsToShow }}>
        {children}
      </FeaturedProductsContext.Provider>
    </Section>
  );
}

const FEATURED_PRODUCTS_QUERY = `#graphql
  query featuredProducts($buyer: BuyerInput, $country: CountryCode, $language: LanguageCode, $query: String)
  @inContext(buyer: $buyer, country: $country, language: $language) {
    products(first: 16, query: $query) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

const COLLECTION_PRODUCTS_QUERY = `#graphql
  query collectionProducts($buyer: BuyerInput, $country: CountryCode, $language: LanguageCode, $handle: String!)
  @inContext(buyer: $buyer, country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 16) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

const PRODUCTS_BY_IDS_QUERY = `#graphql
  query productsByIds($buyer: BuyerInput, $country: CountryCode, $language: LanguageCode, $ids: [ID!]!)
  @inContext(buyer: $buyer, country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export type FeaturedProductsLoaderData = Awaited<ReturnType<typeof loader>>;

export const loader = async (
  args: ComponentLoaderArgs<FeaturedProductsData>,
) => {
  const { data, weaverse } = args;
  const { language, country } = weaverse.storefront.i18n;
  const { selectionMethod = "auto", collection, products } = data;

  const buyer = await weaverse.customerAccount?.getBuyer();
  const buyerVariables = buyer ? { buyer } : {};

  if (selectionMethod === "collection" && collection?.handle) {
    const result = await weaverse.storefront.query<CollectionProductsQuery>(
      COLLECTION_PRODUCTS_QUERY,
      {
        variables: {
          country,
          language,
          handle: collection.handle,
          ...buyerVariables,
        },
      },
    );
    return {
      products: {
        nodes: result.collection?.products.nodes || [],
      },
    };
  }

  if (selectionMethod === "manual" && products?.length) {
    const ids = products.map(
      (product) => `gid://shopify/Product/${product.id}`,
    );
    const { nodes } = await weaverse.storefront.query<ProductsByIdsQuery>(
      PRODUCTS_BY_IDS_QUERY,
      {
        variables: {
          country,
          language,
          ids,
          ...buyerVariables,
        },
      },
    );
    return {
      products: {
        nodes: nodes.filter(Boolean),
      },
    };
  }

  // Default: auto selection (best selling products)
  return await weaverse.storefront.query<FeaturedProductsQuery>(
    FEATURED_PRODUCTS_QUERY,
    {
      variables: {
        country,
        language,
        query: maybeFilterOutCombinedListingsQuery,
        ...buyerVariables,
      },
    },
  );
};

export const schema = createSchema({
  type: "featured-products",
  title: "Featured products",
  childTypes: [
    "featured-products--header",
    "featured-products-items",
    "heading",
    "subheading",
    "paragraph",
  ],
  settings: [
    {
      group: "Product selection",
      inputs: [
        {
          type: "select",
          name: "selectionMethod",
          label: "Source",
          configs: {
            options: [
              { value: "auto", label: "Auto (best selling)" },
              { value: "collection", label: "From a collection" },
              { value: "manual", label: "Manual selection" },
            ],
          },
          defaultValue: "auto",
        },
        {
          type: "collection",
          name: "collection",
          label: "Select collection",
          condition: (data: FeaturedProductsData) =>
            data.selectionMethod === "collection",
        },
        {
          type: "product-list",
          name: "products",
          label: "Select products",
          condition: (data: FeaturedProductsData) =>
            data.selectionMethod === "manual",
        },
      ],
    },
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "displayType",
          label: "Display type",
          defaultValue: "carousel",
          configs: {
            options: [
              { value: "grid", label: "List" },
              { value: "carousel", label: "Slider" },
            ],
          },
        },
        {
          type: "range",
          name: "productsToShow",
          label: "Number of items",
          defaultValue: 4,
          configs: { min: 1, max: 12, step: 1 },
        },
        ...layoutInputs.filter((i) => i.name !== "borderRadius"),
      ],
    },
  ],
  presets: {
    gap: 32,
    selectionMethod: "auto",
    displayType: "carousel",
    productsToShow: 4,
    children: [
      {
        type: "featured-products--header",
        gap: 16,
        children: [
          {
            type: "heading",
            content: "Featured products",
            as: "h4",
            weight: 400,
            alignment: "left",
          },
          {
            type: "view-all-button",
            text: "View all",
            link: "/products",
            showButton: true,
          },
        ],
      },
      { type: "featured-products-items" },
    ],
  },
});
