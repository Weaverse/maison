import { createSchema, useParentInstance } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { useState } from "react";
import type { ProductCardFragment } from "storefront-api.generated";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { ProductCard } from "~/components/product/product-card";
import { Swimlane } from "~/components/swimlane";
import { cn } from "~/utils/cn";

const variants = cva("grid", {
  variants: {
    mobileGridItems: {
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
    },
    desktopGridItems: {
      "3": "md:grid-cols-3",
      "4": "md:grid-cols-4",
      "5": "md:grid-cols-5",
      "6": "md:grid-cols-6",
    },
  },
  defaultVariants: {
    mobileGridItems: "2",
    desktopGridItems: "4",
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

interface ProductItemsData {
  layout?: "grid" | "carousel";
  gap?: number;
  mobileCarouselItems?: number;
  desktopCarouselItems?: number;
  mobileGridItems?: "1" | "2" | "3";
  desktopGridItems?: "3" | "4" | "5" | "6";
  productsToShow?: number;
  arrowsBgColor?: string;
}

interface ProductItemsProps
  extends VariantProps<typeof variants>,
    VariantProps<typeof arrowButtonVariants>,
    ProductItemsData {
  ref?: React.Ref<HTMLDivElement>;
}

function ProductItems(props: ProductItemsProps) {
  const {
    gap,
    ref,
    layout,
    mobileCarouselItems,
    desktopCarouselItems,
    mobileGridItems,
    desktopGridItems,
    productsToShow,
    arrowsBgColor,
    arrowsShape,
    ...rest
  } = props;

  const parent = useParentInstance();
  const products = parent.data?.loaderData?.products;
  const swimlaneRef = useState<HTMLDivElement | null>(null);

  if (!products?.nodes?.length) {
    return null;
  }

  // grid layout
  if (layout === "grid") {
    const itemsToShow = Number(productsToShow ?? 8);
    return (
      <div ref={ref} {...rest}>
        <div
          className={cn(variants({ mobileGridItems, desktopGridItems }))}
          style={{ gap: `40px ${gap}px` }}
        >
          {products.nodes
            .slice(0, itemsToShow)
            .map((product: ProductCardFragment) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
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

    container.scrollTo({
      left: targetIndex * itemWidth,
      behavior: "smooth",
    });
  };

  const handlePrev = () => handleScroll(-1);
  const handleNext = () => handleScroll(1);

  return (
    <div ref={ref} {...rest} className="relative">
      <Swimlane
        ref={(el) => {
          swimlaneRef[1](el);
        }}
        className="mb-6 [grid-auto-columns:var(--mobile-cols)] md:[grid-auto-columns:var(--desktop-cols)]"
        style={
          {
            gap: `${gap}px`,
            "--mobile-cols": `calc((100% - ${mobileCarouselItems - 1} * ${gap}px) / ${mobileCarouselItems})`,
            "--desktop-cols": `calc((100% - ${desktopCarouselItems - 1} * ${gap}px) / ${desktopCarouselItems})`,
          } as React.CSSProperties
        }
      >
        {products.nodes.map((product: ProductCardFragment) => (
          <div key={product.id} className="snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </Swimlane>

      {/* navi arrows */}
      <div className="absolute -left-2 -right-2 md:-left-5 md:-right-5 lg:-left-7 lg:-right-7 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-[1]">
        <button
          type="button"
          onClick={handlePrev}
          className={arrowButtonVariants({ arrowsShape })}
          style={{ backgroundColor: arrowsBgColor }}
          aria-label="Previous product"
        >
          <ArrowLeft />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className={arrowButtonVariants({ arrowsShape })}
          style={{ backgroundColor: arrowsBgColor }}
          aria-label="Next product"
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}

export default ProductItems;

export const schema = createSchema({
  type: "featured-products-items",
  title: "Product items",
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
          condition: (data: ProductItemsData) => data.layout === "carousel",
        },
        {
          type: "range",
          name: "desktopCarouselItems",
          label: "Carousel items (desktop)",
          defaultValue: 4,
          configs: { min: 1, max: 6, step: 1 },
          condition: (data: ProductItemsData) => data.layout === "carousel",
        },
        {
          type: "toggle-group",
          name: "mobileGridItems",
          label: "Grid items (mobile)",
          defaultValue: "2",
          configs: {
            options: [
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
            ],
          },
          condition: (data: ProductItemsData) => data.layout === "grid",
        },
        {
          type: "toggle-group",
          name: "desktopGridItems",
          label: "Grid items (desktop)",
          defaultValue: "4",
          configs: {
            options: [
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
              { value: "6", label: "6" },
            ],
          },
          condition: (data: ProductItemsData) => data.layout === "grid",
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 40,
            step: 1,
            unit: "px",
          },
        },
        {
          type: "range",
          name: "productsToShow",
          label: "Products to show",
          defaultValue: 4,
          configs: {
            min: 1,
            max: 12,
            step: 1,
          },
          condition: (data: ProductItemsData) => data.layout === "grid",
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
          condition: (data: ProductItemsData) => data.layout === "carousel",
        },
        {
          type: "color",
          name: "arrowsBgColor",
          label: "Arrows background color",
          defaultValue: "#EDEAE6",
          condition: (data: ProductItemsData) => data.layout === "carousel",
        },
      ],
    },
  ],
  presets: {
    layout: "carousel",
    mobileCarouselItems: 2,
    desktopCarouselItems: 4,
    mobileGridItems: "2",
    desktopGridItems: "4",
    gap: 16,
    productsToShow: 4,
  },
});
