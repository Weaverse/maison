import { Pagination } from "@shopify/hydrogen";
import type { Collection } from "@shopify/hydrogen/storefront-api-types";
import {
  createSchema,
  type HydrogenComponentProps,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { useLoaderData } from "react-router";
import type { CollectionsQuery } from "storefront-api.generated";
import { variants } from "~/components/link";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { getImageLoadingPriority } from "~/utils/image";
import { CollectionCard } from "./collection-card";

const gridVariants = cva("grid w-full", {
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

interface CollectionsItemsProps
  extends VariantProps<typeof gridVariants>,
    HydrogenComponentProps {
  prevButtonText: string;
  nextButtonText: string;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius: number;
  titleColor?: string;
  countColor?: string;
  showProductCount?: boolean;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  cardPadding?: number;
  cardBorderRadius?: number;
  ref?: React.Ref<HTMLDivElement>;
}

function CollectionsItems(props: CollectionsItemsProps) {
  const { collections } = useLoaderData<CollectionsQuery>();
  const {
    prevButtonText,
    nextButtonText,
    gap,
    mobileGridSize,
    desktopGridSize,
    imageAspectRatio,
    imageBorderRadius,
    titleColor,
    countColor,
    showProductCount = true,
    cardBackgroundColor,
    cardHoverBackgroundColor,
    cardPadding,
    cardBorderRadius,
    ref,
    ...rest
  } = props;

  const cardProps = {
    imageAspectRatio,
    imageBorderRadius,
    titleColor,
    countColor,
    showProductCount,
    cardBackgroundColor,
    cardHoverBackgroundColor,
    cardPadding,
    cardBorderRadius,
  };

  return (
    <div ref={ref} {...rest}>
      <Pagination connection={collections}>
        {({
          nodes,
          isLoading,
          hasPreviousPage,
          hasNextPage,
          NextLink,
          PreviousLink,
        }) => (
          <div className="flex w-full flex-col items-center gap-8">
            {hasPreviousPage && (
              <PreviousLink
                className={cn("mx-auto", variants({ variant: "outline" }))}
              >
                {isLoading ? "Loading..." : prevButtonText}
              </PreviousLink>
            )}
            <div
              className={cn(
                gridVariants({ mobileGridSize, desktopGridSize, gap }),
              )}
            >
              {nodes.map((collection, i) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection as Collection}
                  loading={getImageLoadingPriority(i, 2)}
                  {...cardProps}
                />
              ))}
            </div>
            {hasNextPage && (
              <NextLink
                className={cn("mx-auto", variants({ variant: "outline" }))}
              >
                {isLoading ? "Loading..." : nextButtonText}
              </NextLink>
            )}
          </div>
        )}
      </Pagination>
    </div>
  );
}

export default CollectionsItems;

export const schema = createSchema({
  type: "collections-items",
  title: "Collection items",
  settings: [
    {
      group: "Pagination",
      inputs: [
        {
          type: "text",
          name: "prevButtonText",
          label: "Previous button text",
          defaultValue: "Previous collections",
          placeholder: "Previous collections",
        },
        {
          type: "text",
          name: "nextButtonText",
          label: "Next button text",
          defaultValue: "Next collections",
          placeholder: "Next collections",
        },
      ],
    },
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
