import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import type { ImageAspectRatio } from "~/types/image";

interface ColumnsWithImagesItemsProps extends HydrogenComponentProps {
  gap: number;
  imageAspectRatio: ImageAspectRatio;
  ref?: React.Ref<HTMLDivElement>;
}

function ColumnsWithImagesItems(props: ColumnsWithImagesItemsProps) {
  const { children, gap, imageAspectRatio, ref, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-col sm:grid sm:grid-cols-12"
      // The ratio belongs to the row, not the column: left to each column the
      // images took their own shape and the headings below them started at
      // different heights. `adapt` is deliberately not a valid aspect-ratio
      // value, so it falls through to the image's natural shape.
      style={
        {
          gap: `${gap}px`,
          "--image-aspect-ratio": imageAspectRatio,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export default ColumnsWithImagesItems;

export const schema = createSchema({
  type: "columns-with-images--items",
  title: "Items",
  settings: [
    {
      group: "Items",
      inputs: [
        {
          type: "range",
          label: "Items gap",
          name: "gap",
          configs: {
            min: 16,
            max: 80,
            step: 4,
            unit: "px",
          },
          defaultValue: 40,
        },
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          defaultValue: "1/1",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
      ],
    },
  ],
  childTypes: ["column-with-image--item"],
  presets: {
    children: [
      {
        type: "column-with-image--item",
        imageSrc: IMAGES_PLACEHOLDERS.product_1,
      },
      {
        type: "column-with-image--item",
        imageSrc: IMAGES_PLACEHOLDERS.product_2,
      },
      {
        type: "column-with-image--item",
        imageSrc: IMAGES_PLACEHOLDERS.product_3,
      },
    ],
  },
});
