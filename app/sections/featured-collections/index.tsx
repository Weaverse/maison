import {
  type ComponentLoaderArgs,
  createSchema,
  type WeaverseCollection,
} from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import type { CollectionsByIdsQuery } from "storefront-api.generated";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

const variants = cva("flex flex-col", {
  variants: {
    gap: {
      0: "gap-0",
      4: "gap-1",
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
      36: "gap-9",
      40: "gap-10",
      44: "gap-11",
      48: "gap-12",
      52: "gap-[52px]",
      56: "gap-14",
      60: "gap-[60px]",
    },
  },
  defaultVariants: {
    gap: 60,
  },
});

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
  const { ref, children, gap, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      <div className={variants({ gap })}>{children}</div>
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
  childTypes: ["collection-header", "featured-collections-items"],
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
      inputs: [
        ...layoutInputs.filter(
          (i) => i.name !== "borderRadius" && i.name !== "gap",
        ),
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
          defaultValue: 60,
          configs: { min: 0, max: 60, step: 4, unit: "px" },
        },
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
    children: [
      {
        type: "collection-header",
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
        type: "featured-collections-items",
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
