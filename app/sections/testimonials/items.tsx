import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Children, useRef } from "react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { Swimlane } from "~/components/swimlane";

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

interface TestimonialsItemsProps
  extends VariantProps<typeof arrowButtonVariants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
  mobileCarouselItems?: number;
  desktopCarouselItems?: number;
  arrowsBgColor?: string;
}

function TestimonialsItems(props: TestimonialsItemsProps) {
  const {
    ref,
    gap = 32,
    mobileCarouselItems = 1,
    desktopCarouselItems = 3,
    arrowsShape,
    arrowsBgColor,
    children,
    ...rest
  } = props;
  const swimlaneRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (direction: number) => {
    const container = swimlaneRef.current;
    if (!container) {
      return;
    }

    const items = Array.from(container.children) as HTMLElement[];
    if (items.length === 0) {
      return;
    }

    const itemWidth = items[0].offsetWidth + gap;
    const currentIndex = Math.round(container.scrollLeft / itemWidth);
    const targetIndex = Math.max(
      0,
      Math.min(items.length - 1, currentIndex + direction),
    );

    container.scrollTo({ left: targetIndex * itemWidth, behavior: "smooth" });
  };

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
        {Children.map(children, (child) => (
          <div className="h-full snap-start">{child}</div>
        ))}
      </Swimlane>

      <div className="-translate-y-1/2 pointer-events-none absolute top-1/2 -left-2 -right-2 z-[1] flex justify-between md:-left-16 md:-right-16">
        <button
          aria-label="Previous testimonial"
          className={arrowButtonVariants({ arrowsShape })}
          onClick={() => handleScroll(-1)}
          style={{ backgroundColor: arrowsBgColor }}
          type="button"
        >
          <ArrowLeft />
        </button>
        <button
          aria-label="Next testimonial"
          className={arrowButtonVariants({ arrowsShape })}
          onClick={() => handleScroll(1)}
          style={{ backgroundColor: arrowsBgColor }}
          type="button"
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}

export default TestimonialsItems;

export const schema = createSchema({
  type: "testimonials-items",
  title: "Items",
  childTypes: ["testimonial--item"],
  settings: [
    {
      group: "Items",
      inputs: [
        {
          type: "range",
          name: "mobileCarouselItems",
          label: "Items per view (mobile)",
          defaultValue: 1,
          configs: { min: 1, max: 3, step: 1 },
        },
        {
          type: "range",
          name: "desktopCarouselItems",
          label: "Items per view (desktop)",
          defaultValue: 3,
          configs: { min: 1, max: 5, step: 1 },
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 16,
            max: 40,
            step: 8,
            unit: "px",
          },
          defaultValue: 32,
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
  ],
  presets: {
    mobileCarouselItems: 1,
    desktopCarouselItems: 3,
    gap: 32,
    arrowsShape: "circle",
    arrowsBgColor: "#EDEAE6",
  },
});
