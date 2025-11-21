import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const variants = cva("grid", {
  variants: {
    mobileGridSize: {
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
    },
    desktopGridSize: {
      "2": "sm:grid-cols-2",
      "3": "sm:grid-cols-3",
      "4": "sm:grid-cols-4",
      "6": "sm:grid-cols-6",
    },
  },
  defaultVariants: {
    mobileGridSize: "2",
    desktopGridSize: "6",
  },
});

interface LogoListItemsProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

const LogoListItems = (props: LogoListItemsProps) => {
  const { ref, children, mobileGridSize, desktopGridSize, gap, ...rest } =
    props;

  return (
    <div
      ref={ref}
      {...rest}
      className={variants({ mobileGridSize, desktopGridSize })}
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
};

export default LogoListItems;

export const schema = createSchema({
  type: "logo-list--items",
  title: "Logo items",
  childTypes: ["logo-list--item"],
  settings: [
    {
      group: "Layout",
      inputs: [
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
        },
        {
          type: "toggle-group",
          name: "desktopGridSize",
          label: "Items per row (desktop)",
          defaultValue: "6",
          configs: {
            options: [
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "6", label: "6" },
            ],
          },
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 16,
        },
      ],
    },
  ],
});
