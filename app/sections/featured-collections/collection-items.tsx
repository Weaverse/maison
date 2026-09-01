import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useParentInstance,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { CSSProperties } from "react";
import { Image } from "~/components/image";
import Link, { type LinkStyles, linkStylesInputs } from "~/components/link";
import type { OverlayProps } from "~/components/overlay";
import { Overlay, overlayInputs } from "~/components/overlay";
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
      "2": "md:grid-cols-2",
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

const editorialGridVariants = cva("", {
  variants: {
    desktopGridSize: {
      "2": "md:grid-cols-2",
      "3": "md:grid-cols-3",
      "4": "md:grid-cols-3 lg:grid-cols-4",
      "5": "md:grid-cols-3 xl:grid-cols-5",
      "6": "md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6",
    },
    gap: {
      0: "md:gap-0",
      4: "md:gap-1",
      8: "md:gap-2",
      12: "md:gap-3",
      16: "md:gap-4",
      20: "md:gap-5",
      24: "md:gap-6",
      28: "md:gap-7",
      32: "md:gap-8",
      36: "md:gap-9",
      40: "md:gap-10",
    },
    contentPosition: {
      over: "absolute inset-0 z-1 flex flex-col items-start justify-end",
      below: "",
    },
  },
});

type LayoutStyle = "standard" | "editorial";
type ContentPosition = "over" | "below";

interface CollectionItemsData
  extends VariantProps<typeof gridVariants>,
    Partial<OverlayProps>,
    Partial<LinkStyles>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  layoutStyle?: LayoutStyle;
  contentPosition?: ContentPosition;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius: number;
  collectionNameColor?: string;
  buttonText?: string;
  titleColor?: string;
  countColor?: string;
  showProductCount?: boolean;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  cardPadding?: number;
  cardBorderRadius?: number;
}

type Collection = FeaturedCollectionsLoaderData[0];

type StandardCollectionCardProps = Pick<
  CollectionItemsData,
  | "imageAspectRatio"
  | "imageBorderRadius"
  | "titleColor"
  | "countColor"
  | "showProductCount"
  | "cardBackgroundColor"
  | "cardHoverBackgroundColor"
  | "cardPadding"
  | "cardBorderRadius"
> & {
  collection: Collection;
};

// The Storefront API has no count field on Collection, so the query fetches up
// to 250 product ids. Past that the label reads "250+" rather than reporting a
// wrong number.
function getProductCountLabel(
  products?: {
    nodes: unknown[];
    pageInfo?: { hasNextPage: boolean };
  } | null,
) {
  if (!products) {
    return null;
  }
  const total = products.nodes.length;
  const suffix = products.pageInfo?.hasNextPage ? "+" : "";
  return `${total}${suffix} ${total === 1 && !suffix ? "product" : "products"}`;
}

function StandardCollectionCard({
  collection,
  imageAspectRatio,
  imageBorderRadius,
  titleColor,
  countColor,
  showProductCount = true,
  cardBackgroundColor,
  cardHoverBackgroundColor,
  cardPadding,
  cardBorderRadius,
}: StandardCollectionCardProps) {
  const productCountLabel = getProductCountLabel(collection.products);

  return (
    <Link
      to={`/collections/${collection.handle}`}
      className={cn(
        "group flex flex-col gap-5 bg-(--card-bg) transition-colors duration-300",
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
        } as CSSProperties
      }
      data-motion="fade-up"
    >
      <div
        className={cn(
          "w-full overflow-hidden",
          !collection.image && "bg-gray-100",
        )}
        style={{ borderRadius: `${imageBorderRadius}px` }}
      >
        <Image
          data={collection.image ?? { url: IMAGES_PLACEHOLDERS.image }}
          aspectRatio={
            collection.image
              ? calculateAspectRatio(collection.image, imageAspectRatio)
              : imageAspectRatio
          }
          sizes="auto"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-fit">
          <h6
            className="font-normal text-[26px] line-clamp-1 leading-6"
            style={{ color: titleColor }}
          >
            {collection.title ?? "Title here"}
          </h6>
          <div
            className="h-px w-0 transition-all duration-500 group-hover:w-full"
            style={{ backgroundColor: titleColor || "currentColor" }}
          />
        </div>
        {showProductCount && productCountLabel && (
          <span className="text-sm" style={{ color: countColor }}>
            {productCountLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

type EditorialCollectionCardProps = Pick<
  CollectionItemsData,
  | "desktopGridSize"
  | "imageAspectRatio"
  | "imageBorderRadius"
  | "contentPosition"
  | "collectionNameColor"
  | "buttonText"
  | "enableOverlay"
  | "overlayType"
  | "overlayColor"
  | "overlayColorHover"
  | "overlayOpacity"
  | "gradientDirection"
  | "gradientFrom"
  | "gradientFromOpacity"
  | "gradientTo"
  | "gradientToOpacity"
  | "backgroundColor"
  | "textColor"
  | "borderColor"
  | "backgroundColorHover"
  | "textColorHover"
  | "borderColorHover"
> & {
  collection: Collection;
};

function EditorialCollectionCard({
  collection,
  desktopGridSize,
  imageAspectRatio,
  imageBorderRadius,
  contentPosition = "over",
  collectionNameColor,
  buttonText,
  enableOverlay,
  overlayType,
  overlayColor,
  overlayColorHover,
  overlayOpacity,
  gradientDirection,
  gradientFrom,
  gradientFromOpacity,
  gradientTo,
  gradientToOpacity,
  backgroundColor,
  textColor,
  borderColor,
  backgroundColorHover,
  textColorHover,
  borderColorHover,
}: EditorialCollectionCardProps) {
  const collectionPath = `/collections/${collection.handle}`;
  const imageStyle = {
    aspectRatio: collection.image
      ? calculateAspectRatio(collection.image, imageAspectRatio)
      : imageAspectRatio,
    borderRadius: `${imageBorderRadius}px`,
  };
  const image = (
    <Image
      data={collection.image ?? { url: IMAGES_PLACEHOLDERS.image }}
      sizes="(min-width: 48em) 33vw, 100vw"
    />
  );

  return (
    <div className="group group/overlay relative w-full" data-motion="fade-up">
      {contentPosition === "below" ? (
        <Link
          to={collectionPath}
          aria-label={`View ${collection.title} collection`}
          className="block overflow-hidden"
          style={imageStyle}
        >
          {image}
        </Link>
      ) : (
        <div className="overflow-hidden" style={imageStyle}>
          {image}
        </div>
      )}
      {contentPosition === "over" && (
        <Overlay
          enableOverlay={Boolean(enableOverlay)}
          overlayType={overlayType}
          overlayColor={overlayColor ?? "#000000"}
          overlayColorHover={overlayColorHover ?? overlayColor ?? "#000000"}
          overlayOpacity={overlayOpacity ?? 30}
          gradientDirection={gradientDirection}
          gradientFrom={gradientFrom ?? "#000000"}
          gradientFromOpacity={gradientFromOpacity}
          gradientTo={gradientTo ?? "#000000"}
          gradientToOpacity={gradientToOpacity ?? 0}
          className="z-0"
        />
      )}
      <div
        className={cn(
          contentPosition === "over" && "items-start",
          editorialGridVariants({ contentPosition }),
        )}
      >
        <div
          className={cn(
            contentPosition === "over"
              ? "flex flex-col items-start text-left text-(--collection-name-color)"
              : "py-4",
            contentPosition === "over" && "p-7",
            contentPosition === "over" &&
              (desktopGridSize === "2" || desktopGridSize === "3") &&
              "md:p-12",
          )}
          style={
            { "--collection-name-color": collectionNameColor } as CSSProperties
          }
        >
          {contentPosition === "over" ? (
            <h5>{collection.title}</h5>
          ) : (
            <h6>{collection.title}</h6>
          )}
          {contentPosition === "over" && buttonText && (
            <div className="grid grid-rows-[0fr] translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:mt-4 group-hover:grid-rows-[1fr] group-hover:translate-y-0 group-hover:opacity-100 xl:group-hover:mt-7">
              <div className="overflow-hidden">
                <Link
                  to={collectionPath}
                  variant="custom"
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  borderColor={borderColor}
                  backgroundColorHover={backgroundColorHover}
                  textColorHover={textColorHover}
                  borderColorHover={borderColorHover}
                >
                  {buttonText}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectionItems(props: CollectionItemsData) {
  const {
    ref,
    layoutStyle = "standard",
    gap,
    imageAspectRatio,
    imageBorderRadius,
    contentPosition,
    collectionNameColor,
    buttonText,
    enableOverlay,
    overlayType,
    overlayColor,
    overlayColorHover,
    overlayOpacity,
    gradientDirection,
    gradientFrom,
    gradientFromOpacity,
    gradientTo,
    gradientToOpacity,
    backgroundColor,
    textColor,
    borderColor,
    backgroundColorHover,
    textColorHover,
    borderColorHover,
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
  const items = collections.slice(0, itemsToShow);

  if (layoutStyle === "editorial") {
    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "grid w-full grid-cols-1 gap-2",
          editorialGridVariants({ desktopGridSize, gap }),
        )}
      >
        {items.map((collection, ind) => (
          <EditorialCollectionCard
            key={`${collection.id}-${ind}`}
            collection={collection}
            desktopGridSize={desktopGridSize}
            imageAspectRatio={imageAspectRatio}
            imageBorderRadius={imageBorderRadius}
            contentPosition={contentPosition}
            collectionNameColor={collectionNameColor}
            buttonText={buttonText}
            enableOverlay={enableOverlay}
            overlayType={overlayType}
            overlayColor={overlayColor}
            overlayColorHover={overlayColorHover}
            overlayOpacity={overlayOpacity}
            gradientDirection={gradientDirection}
            gradientFrom={gradientFrom}
            gradientFromOpacity={gradientFromOpacity}
            gradientTo={gradientTo}
            gradientToOpacity={gradientToOpacity}
            backgroundColor={backgroundColor}
            textColor={textColor}
            borderColor={borderColor}
            backgroundColorHover={backgroundColorHover}
            textColorHover={textColorHover}
            borderColorHover={borderColorHover}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(gridVariants({ mobileGridSize, desktopGridSize, gap }))}
    >
      {items.map((collection, ind) => (
        <StandardCollectionCard
          key={`${collection.id}-${ind}`}
          collection={collection}
          imageAspectRatio={imageAspectRatio}
          imageBorderRadius={imageBorderRadius}
          titleColor={titleColor}
          countColor={countColor}
          showProductCount={showProductCount}
          cardBackgroundColor={cardBackgroundColor}
          cardHoverBackgroundColor={cardHoverBackgroundColor}
          cardPadding={cardPadding}
          cardBorderRadius={cardBorderRadius}
        />
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
    pageInfo: { hasNextPage: false },
  },
};

function isStandardLayout(data: CollectionItemsData) {
  return (data.layoutStyle ?? "standard") === "standard";
}

function isEditorialOverlay(data: CollectionItemsData) {
  return data.layoutStyle === "editorial" && data.contentPosition === "over";
}

export default CollectionItems;

export const schema = createSchema({
  type: "featured-collections--items",
  title: "Collection items",
  settings: [
    {
      group: "Collection items",
      inputs: [
        {
          type: "select",
          name: "layoutStyle",
          label: "Layout style",
          defaultValue: "standard",
          configs: {
            options: [
              { value: "standard", label: "Standard grid" },
              { value: "editorial", label: "Editorial" },
            ],
          },
        },
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
          condition: isStandardLayout,
        },
        {
          type: "toggle-group",
          name: "desktopGridSize",
          label: "Items per row (desktop)",
          defaultValue: "5",
          configs: {
            options: [
              { value: "2", label: "2" },
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
          condition: isStandardLayout,
        },
        {
          type: "color",
          name: "cardHoverBackgroundColor",
          label: "Card hover background",
          condition: isStandardLayout,
        },
        {
          type: "range",
          name: "cardPadding",
          label: "Card padding",
          defaultValue: 12,
          configs: { min: 0, max: 32, step: 1, unit: "px" },
          condition: isStandardLayout,
        },
        {
          type: "range",
          name: "cardBorderRadius",
          label: "Card border radius",
          defaultValue: 4,
          configs: { min: 0, max: 50, step: 1, unit: "px" },
          condition: isStandardLayout,
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
        {
          type: "color",
          name: "titleColor",
          label: "Title color",
          condition: isStandardLayout,
        },
        {
          type: "color",
          name: "countColor",
          label: "Count color",
          condition: isStandardLayout,
        },
        {
          type: "switch",
          name: "showProductCount",
          label: "Show product count",
          defaultValue: true,
          condition: isStandardLayout,
        },
      ],
    },
    {
      group: "Editorial card",
      inputs: [
        {
          type: "select",
          name: "contentPosition",
          label: "Content position",
          configs: {
            options: [
              { value: "over", label: "Over image" },
              { value: "below", label: "Below image" },
            ],
          },
          defaultValue: "over",
          condition: (data: CollectionItemsData) =>
            data.layoutStyle === "editorial",
        },
        {
          type: "color",
          name: "collectionNameColor",
          label: "Collection name color",
          defaultValue: "#ffffff",
          condition: isEditorialOverlay,
        },
        {
          type: "heading",
          label: "Overlay",
          condition: isEditorialOverlay,
        },
        ...overlayInputs.map((input) => ({
          ...input,
          condition: isEditorialOverlay,
        })),
        {
          type: "heading",
          label: "Button (optional)",
          condition: isEditorialOverlay,
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Discover now",
          placeholder: "Discover now",
          condition: isEditorialOverlay,
        },
        ...linkStylesInputs.map((input) => ({
          ...input,
          condition: isEditorialOverlay,
        })),
      ],
    },
  ],
});
