import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useParentInstance,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Image } from "~/components/image";
import Link from "~/components/link";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { calculateAspectRatio } from "~/utils/image";
import type { FeaturedCollectionsLoaderData } from ".";

const gridVariants = cva("grid", {
  variants: {
    mobileGridSize: {
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
    },
    desktopGridSize: {
      "3": "md:grid-cols-3",
      "4": "md:grid-cols-4",
      "5": "md:grid-cols-5",
      "6": "md:grid-cols-6",
    },
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
    },
  },
  defaultVariants: {
    mobileGridSize: "2",
    desktopGridSize: "5",
    gap: 16,
  },
});

interface CollectionItemsData
  extends VariantProps<typeof gridVariants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius: number;
  titleColor?: string;
  countColor?: string;
  showProductCount?: boolean;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  cardPadding?: number;
  cardBorderRadius?: number;
}

function CollectionItems(props: CollectionItemsData) {
  const {
    ref,
    gap,
    imageAspectRatio,
    imageBorderRadius,
    titleColor,
    countColor,
    showProductCount = true,
    cardBackgroundColor,
    cardHoverBackgroundColor,
    cardPadding,
    cardBorderRadius,
    mobileGridSize,
    desktopGridSize,
    ...rest
  } = props;

  const parent = useParentInstance();
  const itemsToShow = Number(parent.data?.data?.collectionsToShow ?? 10);
  const collections: FeaturedCollectionsLoaderData = parent.data?.loaderData
    ?.length
    ? parent.data.loaderData
    : new Array(itemsToShow).fill(COLLECTION_PLACEHOLDER);

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(gridVariants({ mobileGridSize, desktopGridSize, gap }))}
    >
      {(collections as any[])
        .slice(0, collections ? itemsToShow : 0)
        .map((collection, ind) => (
          <Link
            key={collection.id + ind}
            to={`/collections/${collection.handle}`}
            className={cn(
              "group flex flex-col gap-5 transition-colors duration-300",
              "bg-(--card-bg)",
              cardHoverBackgroundColor && "hover:bg-(--hover-bg)",
            )}
            style={
              {
                "--card-bg": cardBackgroundColor,
                ...(cardHoverBackgroundColor && {
                  "--hover-bg": cardHoverBackgroundColor,
                }),
                padding: `${cardPadding}px`,
                borderRadius: `${cardBorderRadius}px`,
              } as React.CSSProperties
            }
            data-motion="fade-up"
          >
            {collection.image ? (
              <div
                className="overflow-hidden"
                style={{ borderRadius: `${imageBorderRadius}px` }}
              >
                <Image
                  data={collection.image}
                  aspectRatio={calculateAspectRatio(
                    collection.image,
                    imageAspectRatio,
                  )}
                  sizes="auto"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div
                className="w-full overflow-hidden bg-gray-100"
                style={{ borderRadius: `${imageBorderRadius}px` }}
              >
                <Image
                  data={{ url: IMAGES_PLACEHOLDERS.image }}
                  aspectRatio={imageAspectRatio}
                  sizes="auto"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <div className="w-fit">
                <h6
                  className="font-normal text-[26px] line-clamp-1 leading-6"
                  style={{ color: titleColor }}
                >
                  {collection.title ?? "Title here"}
                </h6>
                <div
                  className="h-[1px] w-0 transition-all duration-500 group-hover:w-full"
                  style={{ backgroundColor: titleColor || "currentColor" }}
                />
              </div>
              {showProductCount && (
                <span className="text-sm" style={{ color: countColor }}>
                  {collection?.products?.nodes?.length !== undefined
                    ? `${collection.products?.nodes?.length} products`
                    : "No products available"}
                </span>
              )}
            </div>
          </Link>
        ))}
    </div>
  );
}

const COLLECTION_PLACEHOLDER: FeaturedCollectionsLoaderData[0] = {
  id: "gid://shopify/Collection/1234567890",
  title: "Collection title",
  handle: "collection-handle",
  description: "Collection description",
  image: {
    id: "gid://shopify/CollectionImage/1234567890",
    altText: "Collection thumbnail",
    width: 1000,
    height: 1000,
    url: IMAGES_PLACEHOLDERS.collection_1,
  },
  products: {
    nodes: [],
  },
};

export default CollectionItems;

export const schema = createSchema({
  type: "featured-collections--items",
  title: "Collection items",
  settings: [
    {
      group: "Collection items",
      inputs: [
        {
          type: "toggle-group",
          name: "mobileGridSize",
          label: "Items per row (mobile)",
          defaultValue: "2",
          configs: {
            options: [
              { value: "1", label: "1" },
              { value: "2", label: "2" },
            ],
          },
        },
        {
          type: "toggle-group",
          name: "desktopGridSize",
          label: "Items per row (desktop)",
          defaultValue: "5",
          configs: {
            options: [
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
              { value: "6", label: "6" },
            ],
          },
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 0,
            max: 40,
            step: 4,
            unit: "px",
          },
          defaultValue: 16,
        },
      ],
    },
    {
      group: "Collection card",
      inputs: [
        {
          type: "color",
          name: "cardBackgroundColor",
          label: "Card background",
          defaultValue: "#DCDCDC",
        },
        {
          type: "color",
          name: "cardHoverBackgroundColor",
          label: "Card hover background",
        },
        {
          type: "range",
          name: "cardPadding",
          label: "Card padding",
          defaultValue: 12,
          configs: { min: 0, max: 32, step: 1, unit: "px" },
        },
        {
          type: "range",
          name: "cardBorderRadius",
          label: "Card border radius",
          defaultValue: 4,
          configs: { min: 0, max: 50, step: 1, unit: "px" },
        },
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          defaultValue: "1/1",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
        {
          type: "range",
          label: "Image border radius",
          name: "imageBorderRadius",
          defaultValue: 4,
          configs: {
            min: 0,
            max: 24,
            step: 2,
            unit: "px",
          },
        },
        { type: "color", name: "titleColor", label: "Title color" },
        { type: "color", name: "countColor", label: "Count color" },
        {
          type: "switch",
          name: "showProductCount",
          label: "Show product count",
          defaultValue: true,
        },
      ],
    },
  ],
});
