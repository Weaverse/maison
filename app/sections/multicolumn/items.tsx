import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const variants = cva("grid", {
  variants: {
    columns: {
      "1": "grid-cols-1",
      "2": "grid-cols-1 sm:grid-cols-2",
      "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: {
    columns: "4",
  },
});

interface MulticolumnItemsProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

const MulticolumnItems = (props: MulticolumnItemsProps) => {
  const { ref, children, columns, gap, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className={variants({ columns })}
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
};

export default MulticolumnItems;

export const schema = createSchema({
  type: "multicolumn--items",
  title: "Multicolumn items",
  childTypes: ["multicolumn--item"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "columns",
          label: "Columns",
          configs: {
            options: [
              { value: "1", label: "1 column" },
              { value: "2", label: "2 columns" },
              { value: "3", label: "3 columns" },
              { value: "4", label: "4 columns" },
            ],
          },
          defaultValue: "4",
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
