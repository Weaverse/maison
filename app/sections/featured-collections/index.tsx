import {
  type ComponentLoaderArgs,
  createSchema,
  type WeaverseCollection,
} from "@weaverse/hydrogen";
import type { CollectionsByIdsQuery } from "storefront-api.generated";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface FeaturedCollectionsData {
  collections: WeaverseCollection[];
  collectionsToShow: number;
}

interface FeaturedCollectionsProps
  extends SectionProps<FeaturedCollectionsLoaderData>,
    FeaturedCollectionsData {
  ref: React.Ref<HTMLElement>;
}

export default function FeaturedCollections(props: FeaturedCollectionsProps) {
  const { ref, children, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
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
      group: "Featured collections",
      inputs: [
        {
          type: "collection-list",
          name: "collections",
          label: "Select collections",
          shouldRevalidate: true,
        },
        {
          type: "range",
          name: "collectionsToShow",
          label: "Collections to show",
          defaultValue: 10,
          configs: { min: 1, max: 12, step: 1 },
        },
      ],
    },
    {
      group: "Layout",
      inputs: [...layoutInputs.filter((i) => i.name !== "borderRadius")],
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
