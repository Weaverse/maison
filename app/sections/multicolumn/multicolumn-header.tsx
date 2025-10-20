import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";

const variants = cva(
  "flex flex-col sm:flex-row sm:items-center sm:justify-between",
  {
    variants: {
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
      },
    },
    defaultVariants: {
      gap: 16,
    },
  },
);

interface HeaderContainerProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

const HeaderContainer = forwardRef<HTMLDivElement, HeaderContainerProps>(
  (props, ref) => {
    const { children, gap } = props;

    return (
      <div ref={ref} className={variants({ gap })}>
        {children}
      </div>
    );
  },
);

export default HeaderContainer;

export const schema = createSchema({
  type: "multicolumn-header",
  title: "Multicolumn header",
  childTypes: ["heading", "view-all-button"],
  settings: [
    {
      group: "Header Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Item spacing (mobile)",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 32,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
  ],
});
