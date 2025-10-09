import {
  type ComponentLoaderArgs,
  createSchema,
  type WeaverseCollection,
} from "@weaverse/hydrogen";
import type { CollectionsByIdsQuery } from "storefront-api.generated";
import { backgroundInputs } from "~/components/background-image";
import type { HeadingProps } from "~/components/heading";
import Heading, { headingInputs } from "~/components/heading";
import Link from "~/components/link";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface FeaturedCollectionsData {
  collections: WeaverseCollection[];
  collectionsToShow: number;
  heading: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  headerColor?: string;
  viewAllText?: string;
  viewAllUrl?: string;
  size?: HeadingProps["size"];
  mobileSize?: HeadingProps["mobileSize"];
  desktopSize?: HeadingProps["desktopSize"];
  weight?: HeadingProps["weight"];
  letterSpacing?: HeadingProps["letterSpacing"];
  alignment?: HeadingProps["alignment"];
  minSize?: HeadingProps["minSize"];
  maxSize?: HeadingProps["maxSize"];
  animate?: HeadingProps["animate"];
  itemSpacing: number;
}

interface FeaturedCollectionsProps
  extends SectionProps<FeaturedCollectionsLoaderData>,
    FeaturedCollectionsData {
  ref: React.Ref<HTMLElement>;
}

export default function FeaturedCollections(props: FeaturedCollectionsProps) {
  const {
    ref,
    loaderData,
    children,
    heading,
    headingTagName,
    headerColor,
    size,
    mobileSize,
    desktopSize,
    weight,
    letterSpacing,
    alignment,
    minSize,
    maxSize,
    animate,
    viewAllText,
    viewAllUrl,
    itemSpacing,
    ...rest
  } = props;
  return (
    <Section ref={ref} {...rest}>
      <div className="flex flex-col" style={{ gap: `${itemSpacing}px` }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Heading
            content={heading}
            as={headingTagName}
            color={headerColor}
            size={size}
            mobileSize={mobileSize}
            desktopSize={desktopSize}
            weight={weight}
            letterSpacing={letterSpacing}
            alignment={alignment}
            minSize={minSize}
            maxSize={maxSize}
            animate={animate}
          />
          {viewAllText && (
            <div className="flex items-center gap-2">
              <Link
                to={viewAllUrl}
                className="text-sm"
                style={{ color: headerColor }}
              >
                {viewAllText}
              </Link>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="11"
                viewBox="0 0 20 11"
                fill="none"
              >
                <path
                  d="M14.0575 0.376953L13.1737 1.26082L16.9236 5.0107H0.625V6.26074H16.9234L13.1737 10.0105L14.0575 10.8944L19.3163 5.63566L14.0575 0.376953Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="">{children}</div>
      </div>
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
  childTypes: ["featured-collections-items"],
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
          shouldRevalidate: true,
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
          name: "itemSpacing",
          label: "Items spacing",
          defaultValue: 64,
          shouldRevalidate: true,
          configs: { min: 0, max: 80, step: 1, unit: "px" },
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
    {
      group: "Header",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Collections",
          placeholder: "Collections",
        },
        ...headingInputs
          .filter((input) => input.name !== "color")
          .map((input) => {
            if (input.name === "as")
              return { ...input, name: "headingTagName", defaultValue: "h4" };
            if (input.name === "weight") return { ...input, defaultValue: 400 };
            return input;
          }),
        { type: "color", name: "headerColor", label: "Header color" },
        {
          type: "text",
          name: "viewAllText",
          label: "View all text",
          defaultValue: "View All",
        },
        {
          type: "text",
          name: "viewAllUrl",
          label: "View all URL",
          defaultValue: "/collections",
        },
      ],
    },
  ],
  presets: {
    haeding: "Collections",
    headingTagName: "h4",
    weight: 400,
    alignment: "left",
    viewAllText: "View All",
    viewAllUrl: "/collections",
    itemSpacing: 60,
    children: [
      {
        type: "featured-collections-items",
        mobileGridSize: "2",
        desktopGridSize: "5",
        gap: 16,
        imageAspectRatio: "1/1",
        imageBorderRadius: 4,
        itemSpacing: 20,
        showProductCount: true,
        cardBackgroundColor: "#DCDCDC",
        cardPadding: 12,
        cardBorderRadius: 4,
      },
    ],
  },
});
