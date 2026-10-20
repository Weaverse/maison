import {
  createSchema,
  type HydrogenComponentProps,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { type OverlayProps, overlayInputs } from "~/components/overlay";
import { OverlayAndBackground } from "~/components/overlay-and-background";

// `relative` anchors the background and overlay layers and `overflow-hidden`
// keeps them inside the rounded corner. `isolate` is what makes them visible
// at all: both sit at a negative z-index, and `position: relative` alone does
// not open a stacking context, so they would paint behind this item's own
// background colour and never be seen. `group/overlay` is the named group the
// Overlay component's hover colour keys off; without it that setting is
// present in the Studio and does nothing.
//
// The flex layout moved to the content wrapper below, which is the layer the
// children are laid out in.
const variants = cva("group/overlay relative isolate overflow-hidden p-5", {
  variants: {
    borderRadius: {
      0: "rounded-none",
      2: "rounded-xs",
      4: "rounded-sm",
      6: "rounded-md",
      8: "rounded-lg",
      10: "rounded-[10px]",
      12: "rounded-xl",
      14: "rounded-[14px]",
      16: "rounded-2xl",
      18: "rounded-[18px]",
      20: "rounded-[20px]",
    },
  },
  defaultVariants: {
    borderRadius: 4,
  },
});

interface MulticolumnItemProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps,
    OverlayProps {
  backgroundColor?: string;
  backgroundImage?: WeaverseImage | string;
  ref?: React.Ref<HTMLDivElement>;
}

const MulticolumnItem = (props: MulticolumnItemProps) => {
  const {
    ref,
    backgroundColor,
    backgroundImage,
    borderRadius,
    children,
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
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className={variants({ borderRadius })}
      style={{ backgroundColor }}
    >
      <OverlayAndBackground
        backgroundImage={backgroundImage}
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
      />
      {/* The children need a positioned layer of their own.
          A gradient overlay is `z-0`, and CSS paints positioned z-0 elements
          after in-flow content, so an opaque gradient covered the heading, the
          paragraph and the button rather than tinting the image behind them.
          A solid overlay is `z-[-1]` and never did. `relative` puts the
          content on the overlay's level, where DOM order decides and the
          content comes second — the same thing `Section` does with its own
          content wrapper, and it holds for both overlay types. */}
      <div className="relative flex flex-col items-start gap-5">{children}</div>
    </div>
  );
};

export default MulticolumnItem;

export const schema = createSchema({
  type: "multicolumn--item",
  title: "Multicolumn item",
  childTypes: ["heading", "paragraph", "button"],
  settings: [
    {
      group: "Style",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
          defaultValue: "#DCDCDC",
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          defaultValue: 4,
          configs: {
            min: 0,
            max: 20,
            step: 2,
            unit: "px",
          },
        },
      ],
    },
    {
      group: "Background",
      inputs: [
        {
          type: "image",
          name: "backgroundImage",
          label: "Background image",
        },
        {
          type: "heading",
          label: "Overlay",
        },
        ...overlayInputs,
      ],
    },
  ],
});
