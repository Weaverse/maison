import { createSchema, useParentInstance } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { useState } from "react";
import { Swiper, type SwiperClass, SwiperSlide } from "swiper/react";
import "swiper/css";
import type { ProductCardFragment } from "storefront-api.generated";
import { ProductCard } from "~/components/product/product-card";
import { cn } from "~/utils/cn";
import { ArrowLeft, ArrowRight } from "~/components/icons";

const variants = cva("grid", {
  variants: {
    gap: {
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
    },
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
    gap: 16,
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

interface ProductItemsData {
  layout?: "grid" | "carousel";
  slidesPerView?: number;
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
    slidesPerView,
    mobileGridSize,
    desktopGridSize,
    productsToShow,
    arrowsBgColor,
    arrowsShape,
    ...rest
  } = props;

  const parent = useParentInstance();
  const products = parent.data?.loaderData?.products;
  const itemsToShow = Number(productsToShow ?? 8);
  const [swiperRef, setSwiperRef] = useState<SwiperClass | null>(null);

  if (!products?.nodes?.length) {
    return null;
  }

  // grid layout
  if (layout === "grid") {
    return (
      <div ref={ref} {...rest}>
        <div
          className={cn(variants({ mobileGridSize, desktopGridSize }))}
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
  return (
    <div ref={ref} {...rest} className="relative">
      <Swiper
        key={`swiper-carousel-${slidesPerView}-${gap}`}
        slidesPerView={1}
        spaceBetween={gap}
        onSwiper={setSwiperRef}
        loop={true}
        breakpoints={{
          0: {
            slidesPerView: 2,
            spaceBetween: gap,
          },
          768: {
            slidesPerView: slidesPerView || 4,
            spaceBetween: gap,
          },
        }}
        className="mb-6 w-full py-4"
      >
        {products.nodes.map((product: ProductCardFragment) => (
          <SwiperSlide key={product.id}>
            <div className="relative h-full">
              <ProductCard product={product} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* navi arrows */}
      <div className="absolute -left-2 -right-2 md:-left-5 md:-right-5 lg:-left-7 lg:-right-7 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-[1]">
        <button
          type="button"
          onClick={() => swiperRef?.slidePrev()}
          className={arrowButtonVariants({ arrowsShape })}
          style={{ backgroundColor: arrowsBgColor }}
          aria-label="Previous product"
        >
          <ArrowLeft />
        </button>

        <button
          type="button"
          onClick={() => swiperRef?.slideNext()}
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
          name: "slidesPerView",
          label: "Slides per view (desktop)",
          defaultValue: 4,
          configs: { min: 1, max: 6, step: 1 },
          condition: (data: ProductItemsData) => data.layout === "carousel",
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
              { value: "3", label: "3" },
            ],
          },
          condition: (data: ProductItemsData) => data.layout === "grid",
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
    slidesPerView: 4,
    mobileGridSize: "2",
    desktopGridSize: "4",
    gap: 16,
    productsToShow: 4,
  },
});
