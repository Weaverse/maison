import {
  type ComponentLoaderArgs,
  createSchema,
  type WeaverseCollection,
} from "@weaverse/hydrogen";
import type { CollectionsByIdsQuery } from "storefront-api.generated";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { useAnimation } from "~/hooks/use-animation";

interface FeaturedCollectionsData {
  collections: WeaverseCollection[];
  collectionsToShow: number;
  displayType: "grid" | "carousel";
}

interface FeaturedCollectionsProps
  extends SectionProps<FeaturedCollectionsLoaderData>,
    FeaturedCollectionsData {
  ref: React.Ref<HTMLElement>;
}

import { createContext } from "react";

export const FeaturedCollectionsContext = createContext<{
  displayType?: "grid" | "carousel";
  collectionsToShow?: number;
} | null>(null);

export default function FeaturedCollections(props: FeaturedCollectionsProps) {
  const {
    ref,
    children,
    displayType,
    collectionsToShow,
    collections,
    ...rest
  } = props;
  const [scope] = useAnimation(ref);
  return (
    <Section ref={scope} {...rest}>
      <FeaturedCollectionsContext.Provider
        value={{ displayType, collectionsToShow }}
      >
        {children}
      </FeaturedCollectionsContext.Provider>
    </Section>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query collectionsByIds($country: CountryCode, $language: LanguageCode, $ids: [ID!]!)
  @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Collection {
        id
        title
        handle
        onlineStoreUrl
        description
        image {
          id
          altText
          width
          height
          url
        }
        products(first: 250) { nodes { id } }
      }
    }
  }
` as const;

export type FeaturedCollectionsLoaderData = Awaited<ReturnType<typeof loader>>;

export const loader = async ({
  data,
  weaverse,
}: ComponentLoaderArgs<FeaturedCollectionsData>) => {
  const { language, country } = weaverse.storefront.i18n;
  const ids = data.collections?.map(
    (collection) => `gid://shopify/Collection/${collection.id}`,
  );
  if (ids?.length) {
    const { nodes } = await weaverse.storefront.query<CollectionsByIdsQuery>(
      COLLECTIONS_QUERY,
      {
        variables: {
          country,
          language,
          ids,
        },
      },
    );
    return nodes.filter(Boolean);
  }
  return [];
};

export const schema = createSchema({
  type: "featured-collections",
  title: "Featured collections",
  childTypes: ["featured-collections--header", "featured-collections--items"],
  settings: [
    {
      group: "Collections",
      inputs: [
        {
          type: "collection-list",
          name: "collections",
          label: "Select collections",
          shouldRevalidate: true,
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
          defaultValue: "grid",
          configs: {
            options: [
              { value: "grid", label: "List" },
              { value: "carousel", label: "Slider" },
            ],
          },
        },
        {
          type: "range",
          name: "collectionsToShow",
          label: "Number of items",
          defaultValue: 10,
          configs: { min: 1, max: 12, step: 1 },
        },
        ...layoutInputs.filter((i) => i.name !== "borderRadius"),
      ],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundImage" &&
            inp.name !== "backgroundFit" &&
            inp.name !== "backgroundPosition",
        ),
      ],
    },
  ],
  presets: {
    gap: 60,
    displayType: "grid",
    collectionsToShow: 10,
    children: [
      {
        type: "featured-collections--header",
        gap: 16,
        children: [
          {
            type: "heading",
            content: "Collections",
            as: "h4",
            weight: 400,
            alignment: "left",
          },
          {
            type: "view-all-button",
            text: "VIEW ALL",
            link: "/collections",
            showButton: true,
          },
        ],
      },
      {
        type: "featured-collections--items",
        mobileGridSize: "2",
        desktopGridSize: "5",
        gap: 16,
        imageAspectRatio: "1/1",
        imageBorderRadius: 4,
        showProductCount: true,
        cardBackgroundColor: "#DCDCDC",
        cardPadding: 12,
        cardBorderRadius: 4,
      },
    ],
  },
});
