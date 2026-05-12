import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useParentInstance,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { useState } from "react";
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

interface CollectionItemsData
  extends VariantProps<typeof gridVariants>,
    VariantProps<typeof arrowButtonVariants>,
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
  mobileCarouselItems?: number;
  desktopCarouselItems?: number;
  arrowsBgColor?: string;
}

import { useContext } from "react";
import { FeaturedCollectionsContext } from "./index";

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
    mobileCarouselItems,
    desktopCarouselItems,
    arrowsBgColor,
    arrowsShape,
    ...rest
  } = props;

  const parent = useParentInstance();
  const context = useContext(FeaturedCollectionsContext);
  const layout =
    context?.displayType ||
    parent.data?.data?.displayType ||
    (props as any).layout ||
    "grid";
  const itemsToShow = Number(
    context?.collectionsToShow ?? parent.data?.data?.collectionsToShow ?? 10,
  );
  const collections: FeaturedCollectionsLoaderData = parent.data?.loaderData
    ?.length
    ? parent.data.loaderData
    : new Array(itemsToShow).fill(COLLECTION_PLACEHOLDER);

  const swimlaneRef = useState<HTMLDivElement | null>(null);

  const renderCollectionCard = (collection: any, ind: number) => (
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
  );

  if (layout === "grid") {
    return (
      <div
        ref={ref}
        {...rest}
        className={cn(gridVariants({ mobileGridSize, desktopGridSize, gap }))}
      >
        {(collections as any[])
          .slice(0, collections ? itemsToShow : 0)
          .map((collection, ind) => renderCollectionCard(collection, ind))}
      </div>
    );
  }

  // carousel layout
  const handleScroll = (direction: number) => {
    const container = swimlaneRef[0];
    if (!container) {
      return;
    }
    const items = Array.from(container.children) as HTMLElement[];
    if (items.length === 0) {
      return;
    }
    const containerScrollLeft = container.scrollLeft;
    const itemWidth = items[0].offsetWidth + gap;
    const currentIndex = Math.round(containerScrollLeft / itemWidth);
    const targetIndex = Math.max(
      0,
      Math.min(items.length - 1, currentIndex + direction),
    );
    container.scrollTo({ left: targetIndex * itemWidth, behavior: "smooth" });
  };

  const handlePrev = () => handleScroll(-1);
  const handleNext = () => handleScroll(1);

  return (
    <div ref={ref} {...rest} className="relative group/carousel">
      <Swimlane
        ref={(el) => swimlaneRef[1](el)}
        className="mb-6 [grid-auto-columns:var(--mobile-cols)] md:[grid-auto-columns:var(--desktop-cols)]"
        style={
          {
            gap: `${gap}px`,
            "--mobile-cols": `calc((100% - ${Number(mobileCarouselItems ?? 2) - 1} * ${gap}px) / ${mobileCarouselItems ?? 2})`,
            "--desktop-cols": `calc((100% - ${Number(desktopCarouselItems ?? 5) - 1} * ${gap}px) / ${desktopCarouselItems ?? 5})`,
          } as React.CSSProperties
        }
      >
        {(collections as any[])
          .slice(0, collections ? itemsToShow : 0)
          .map((collection, ind) => (
            <div key={collection.id + ind} className="snap-start flex-shrink-0">
              {renderCollectionCard(collection, ind)}
            </div>
          ))}
      </Swimlane>

      {/* navi arrows */}
      <div className="absolute -left-2 -right-2 md:-left-5 md:-right-5 lg:-left-7 lg:-right-7 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-[1] opacity-0 group-hover/carousel:opacity-100 transition-opacity">
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
      group: "Collection items",
      inputs: [
        {
          type: "range",
          name: "mobileCarouselItems",
          label: "Items per row (mobile)",
          defaultValue: 2,
          configs: { min: 1, max: 4, step: 1 },
        },
        {
          type: "range",
          name: "desktopCarouselItems",
          label: "Items per row (desktop)",
          defaultValue: 5,
          configs: { min: 3, max: 6, step: 1 },
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
        },
        {
          type: "color",
          name: "arrowsBgColor",
          label: "Arrows background color",
          defaultValue: "#EDEAE6",
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
