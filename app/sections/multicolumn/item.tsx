import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const variants = cva("flex flex-col items-start gap-5 p-5", {
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
    HydrogenComponentProps {
  backgroundColor?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const MulticolumnItem = (props: MulticolumnItemProps) => {
  const { ref, backgroundColor, borderRadius, children, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className={variants({ borderRadius })}
      style={{ backgroundColor }}
    >
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
  ],
});
