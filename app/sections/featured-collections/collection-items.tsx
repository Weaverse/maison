import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useParentInstance,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { Swimlane } from "~/components/swimlane";
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
  },
  defaultVariants: {
    mobileGridSize: "2",
    desktopGridSize: "4",
  },
});

const arrowButtonVariants = cva("p-4 pointer-events-auto", {
  variants: {
    arrowsShape: {
      square: "",
      rounded: "rounded-md",
      circle: "rounded-full",
    },
  },
  defaultVariants: {
    arrowsShape: "circle",
  },
});

// Height-to-width factor for each supported aspect ratio, used to derive the
// image height from the carousel column width. "adapt" is unknown at render
// time, so it falls back to centering on the whole card.
const IMAGE_HEIGHT_FACTOR: Partial<Record<ImageAspectRatio, number>> = {
  "1/1": 1,
  "3/4": 4 / 3,
  "4/3": 3 / 4,
  "16/9": 9 / 16,
};

// Featured products centers its arrows on the whole product card, which — because
// that card carries a much taller text block — lands at ~79% of the image height.
// Collection cards have a short text block, so anchor to the image and reuse the
// same fraction to keep both carousels visually aligned.
const ARROWS_IMAGE_POSITION = 4.79;

interface CollectionItemsData
  extends VariantProps<typeof gridVariants>,
    VariantProps<typeof arrowButtonVariants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  layout?: "grid" | "carousel";
  gap?: number;
  mobileCarouselItems?: number;
  desktopCarouselItems?: number;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius: number;
  titleColor?: string;
  countColor?: string;
  showProductCount?: boolean;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  cardPadding?: number;
  cardBorderRadius?: number;
  arrowsBgColor?: string;
}

type CollectionCardProps = Pick<
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
  collection: FeaturedCollectionsLoaderData[0];
};

function CollectionCard({
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
}: CollectionCardProps) {
  return (
    <Link
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
  );
}

function CollectionItems(props: CollectionItemsData) {
  const {
    ref,
    layout = "carousel",
    gap = 16,
    mobileCarouselItems = 2,
    desktopCarouselItems = 4,
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
    arrowsShape,
    arrowsBgColor,
    ...rest
  } = props;

  const parent = useParentInstance();
  const swimlaneRef = useRef<HTMLDivElement | null>(null);
  const itemsToShow = Number(parent.data?.data?.collectionsToShow ?? 10);
  const collections: FeaturedCollectionsLoaderData = parent.data?.loaderData
    ?.length
    ? parent.data.loaderData
    : new Array(itemsToShow).fill(COLLECTION_PLACEHOLDER);
  const items = collections.slice(0, itemsToShow);

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

  // grid layout
  if (layout === "grid") {
    return (
      <div
        ref={ref}
        {...rest}
        className={cn(gridVariants({ mobileGridSize, desktopGridSize }))}
        style={{ gap: `40px ${gap}px` }}
      >
        {items.map((collection, ind) => (
          <CollectionCard
            key={`${collection.id}-${ind}`}
            collection={collection}
            {...cardProps}
          />
        ))}
      </div>
    );
  }

  // carousel layout
  const handleScroll = (direction: number) => {
    const container = swimlaneRef.current;
    if (!container) {
      return;
    }

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) {
      return;
    }

    const itemWidth = children[0].offsetWidth + gap;
    const currentIndex = Math.round(container.scrollLeft / itemWidth);
    const targetIndex = Math.max(
      0,
      Math.min(children.length - 1, currentIndex + direction),
    );

    container.scrollTo({
      left: targetIndex * itemWidth,
      behavior: "smooth",
    });
  };

  const handlePrev = () => handleScroll(-1);
  const handleNext = () => handleScroll(1);

  const padding = cardPadding ?? 0;
  const heightFactor = IMAGE_HEIGHT_FACTOR[imageAspectRatio];
  const arrowsTop = heightFactor
    ? `calc(${padding}px + (var(--cols) - ${padding * 2}px) * ${heightFactor} * ${ARROWS_IMAGE_POSITION})`
    : "50%";

  return (
    <div
      ref={ref}
      {...rest}
      className="relative"
      style={
        {
          "--mobile-cols": `calc((100% - ${mobileCarouselItems - 1} * ${gap}px) / ${mobileCarouselItems})`,
          "--desktop-cols": `calc((100% - ${desktopCarouselItems - 1} * ${gap}px) / ${desktopCarouselItems})`,
        } as React.CSSProperties
      }
    >
      <Swimlane
        ref={swimlaneRef}
        className="[grid-auto-columns:var(--mobile-cols)] md:[grid-auto-columns:var(--desktop-cols)]"
        style={{ gap: `${gap}px` }}
      >
        {items.map((collection, ind) => (
          <div key={`${collection.id}-${ind}`} className="snap-start">
            <CollectionCard collection={collection} {...cardProps} />
          </div>
        ))}
      </Swimlane>

      {/* navi arrows */}
      <div
        className="absolute -left-2 -right-2 md:-left-5 md:-right-5 lg:-left-7 lg:-right-7 [--cols:var(--mobile-cols)] md:[--cols:var(--desktop-cols)] -translate-y-1/2 flex justify-between pointer-events-none z-[1]"
        style={{ top: arrowsTop }}
      >
        <button
          type="button"
          onClick={handlePrev}
          className={arrowButtonVariants({ arrowsShape })}
          style={{ backgroundColor: arrowsBgColor }}
          aria-label="Previous collection"
        >
          <ArrowLeft />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className={arrowButtonVariants({ arrowsShape })}
          style={{ backgroundColor: arrowsBgColor }}
          aria-label="Next collection"
        >
          <ArrowRight />
        </button>
      </div>
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
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Display mode",
          defaultValue: "carousel",
          configs: {
            options: [
              { value: "grid", label: "Grid" },
              { value: "carousel", label: "Carousel" },
            ],
          },
        },
        {
          type: "range",
          name: "mobileCarouselItems",
          label: "Carousel items (mobile)",
          defaultValue: 2,
          configs: { min: 1, max: 4, step: 1 },
          condition: (data: CollectionItemsData) => data.layout === "carousel",
        },
        {
          type: "range",
          name: "desktopCarouselItems",
          label: "Carousel items (desktop)",
          defaultValue: 4,
          configs: { min: 1, max: 6, step: 1 },
          condition: (data: CollectionItemsData) => data.layout === "carousel",
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
          condition: (data: CollectionItemsData) => data.layout === "grid",
        },
        {
          type: "toggle-group",
          name: "desktopGridSize",
          label: "Items per row (desktop)",
          defaultValue: "4",
          configs: {
            options: [
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
              { value: "6", label: "6" },
            ],
          },
          condition: (data: CollectionItemsData) => data.layout === "grid",
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
      group: "Navigation",
      inputs: [
        {
          type: "toggle-group",
          name: "arrowsShape",
          label: "Arrows shape",
          defaultValue: "circle",
          configs: {
            options: [
              { value: "square", label: "Square", icon: "square" },
              { value: "rounded", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
            ],
          },
          condition: (data: CollectionItemsData) => data.layout === "carousel",
        },
        {
          type: "color",
          name: "arrowsBgColor",
          label: "Arrows background color",
          defaultValue: "#EDEAE6",
          condition: (data: CollectionItemsData) => data.layout === "carousel",
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
  presets: {
    layout: "carousel",
    mobileGridSize: "2",
    desktopGridSize: "4",
    mobileCarouselItems: 2,
    desktopCarouselItems: 4,
    gap: 16,
    imageAspectRatio: "1/1",
    imageBorderRadius: 4,
    showProductCount: true,
    cardBackgroundColor: "#DCDCDC",
    cardPadding: 12,
    cardBorderRadius: 4,
    arrowsShape: "circle",
    arrowsBgColor: "#EDEAE6",
  },
});
