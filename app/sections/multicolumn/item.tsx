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
const variants = cva(
  "group/overlay relative isolate flex flex-col items-start gap-5 overflow-hidden p-5",
  {
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
  },
);

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
      {children}
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
