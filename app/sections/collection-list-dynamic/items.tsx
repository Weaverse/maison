import {
  createSchema,
  type HydrogenComponentProps,
  useParentInstance,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import type { ImageAspectRatio } from "~/types/image";
import { calculateAspectRatio } from "~/utils/image";
import type { CollectionListLoaderData } from ".";
import { cn } from "~/utils/cn";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

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
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
    },
  },
  defaultVariants: {
    mobileGridSize: "2",
    desktopGridSize: "4",
    gap: 16,
  },
});

interface CollectionsItemsProps
  extends HydrogenComponentProps,
    VariantProps<typeof gridVariants> {
  ref?: React.Ref<HTMLDivElement>;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius: number;
  itemSpacing: number;
  titleColor?: string;
  countColor?: string;
  showProductCount?: boolean;
  cardBackgroundColor?: string;
  cardPadding?: number;
  cardBorderRadius?: number;
  mobileGridSize: "1" | "2" | "3";
  desktopGridSize: "3" | "4" | "5" | "6";
}

export default function CollectionsItems(props: CollectionsItemsProps) {
  const {
    ref,
    gap,
    imageAspectRatio,
    imageBorderRadius,
    itemSpacing,
    titleColor,
    countColor,
    showProductCount = true,
    cardBackgroundColor,
    cardPadding,
    cardBorderRadius,
    mobileGridSize,
    desktopGridSize,
    ...rest
  } = props;

  const parent = useParentInstance();
  const data: CollectionListLoaderData = parent.data?.loaderData;
  const itemsToShow = Number(parent.data?.data?.collectionsToShow ?? 10);

  if (!data?.collections?.length) {
    return (
      <div ref={ref} {...rest}>
        <div
          className={cn(gridVariants({ mobileGridSize, desktopGridSize, gap }))}
        >
          {Array.from({ length: itemsToShow }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col"
              style={{
                background: cardBackgroundColor,
                padding: `${cardPadding}px`,
                borderRadius: `${cardBorderRadius}px`,
                gap: "20px",
              }}
            >
              <div
                className="w-full overflow-hidden rounded"
                style={{ borderRadius: `${imageBorderRadius}px` }}
              >
                <Image
                  data={{ url: IMAGES_PLACEHOLDERS.image }}
                  aspectRatio={imageAspectRatio}
                  sizes="auto"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h6
                  className="font-normal text-4xl"
                  style={{ color: titleColor, lineHeight: "1.1" }}
                >
                  Title here
                </h6>
                {showProductCount && (
                  <span className="text-sm" style={{ color: countColor }}>
                    0 products
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { collections } = data;

  return (
    <div ref={ref} {...rest}>
      <div
        className={cn(gridVariants({ mobileGridSize, desktopGridSize, gap }))}
      >
        {collections.slice(0, itemsToShow).map((collection: any) => {
          return (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="flex flex-col gap-5"
              style={{
                background: cardBackgroundColor,
                padding: `${cardPadding}px`,
                borderRadius: `${cardBorderRadius}px`,
              }}
            >
              {collection.image ? (
                <Image
                  data={collection.image}
                  aspectRatio={calculateAspectRatio(
                    collection.image,
                    imageAspectRatio,
                  )}
                  sizes="auto"
                  style={{ borderRadius: `${imageBorderRadius}px` }}
                />
              ) : (
                <div
                  className="w-full overflow-hidden bg-gray-100"
                  style={{ borderRadius: `${imageBorderRadius}px` }}
                >
                  <Image
                    data={{ url: IMAGES_PLACEHOLDERS.image }}
                    aspectRatio={imageAspectRatio}
                    sizes="auto"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <h6
                  className="font-normal text-[26px] line-clamp-1"
                  style={{ color: titleColor }}
                >
                  {collection.title ?? "Title here"}
                </h6>
                {showProductCount && (
                  <span className="text-sm" style={{ color: countColor }}>
                    {collection.productsCount !== undefined
                      ? `${collection.productsCount} products`
                      : collection?.products?.nodes?.length !== undefined
                        ? `${collection.products?.nodes?.length} products`
                        : "No products available"}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const schema = createSchema({
  type: "collection-list-dynamic-items",
  title: "Collection items",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "toggle-group",
          name: "mobileGridSize",
          label: "Mobile grid layout",
          defaultValue: "2",
          configs: {
            options: [
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
            ],
          },
        },
        {
          type: "toggle-group",
          name: "desktopGridSize",
          label: "Desktop grid layout",
          defaultValue: "4",
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
          defaultValue: 16,
          configs: { min: 0, max: 32, step: 4 },
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
          defaultValue: "#B9B0A0",
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
          name: "imageBorderRadius",
          label: "Image border radius",
          defaultValue: 4,
          configs: { min: 0, max: 50, step: 1, unit: "px" },
        },
        {
          type: "range",
          name: "itemSpacing",
          label: "Item spacing",
          defaultValue: 20,
          configs: { min: 0, max: 40, step: 1, unit: "px" },
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
  presets: {
    mobileGridSize: "2",
    desktopGridSize: "5",
    gap: 16,
    imageAspectRatio: "1/1",
    imageBorderRadius: 4,
    itemSpacing: 20,
    showProductCount: true,
    cardBackgroundColor: "#B9B0A0",
    cardPadding: 12,
    cardBorderRadius: 4,
  },
});