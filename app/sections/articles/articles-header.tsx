import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

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
        36: "gap-9",
        40: "gap-10",
        44: "gap-11",
        48: "gap-12",
        52: "gap-[52px]",
        56: "gap-14",
        60: "gap-[60px]",
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

const HeaderContainer = (props: HeaderContainerProps) => {
  const { ref, children, gap, ...rest } = props;

  return (
    <div ref={ref} {...rest} className={variants({ gap })}>
      {children}
    </div>
  );
};

export default HeaderContainer;

export const schema = createSchema({
  type: "articles-header",
  title: "Articles header",
  childTypes: ["heading", "view-all-button"],
  settings: [
    {
      group: "Header layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Item spacing (mobile)",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
  ],
});
