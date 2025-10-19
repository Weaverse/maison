import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";

const variants = cva(
  "flex grow flex-col justify-center gap-6 px-5 py-10 md:px-10 [&_.paragraph]:mx-[unset] [&_.paragraph]:w-auto",
  {
    variants: {
      alignment: {
        left: "items-start",
        center: "items-center",
        right: "items-end",
      },
    },
    defaultVariants: {
      alignment: "center",
    },
  },
);

interface ImageWithTextContentProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function ImageWithTextContent(props: ImageWithTextContentProps) {
  const { alignment, children, ref, ...rest } = props;
  return (
    <div ref={ref} {...rest} className={clsx(variants({ alignment }))}>
      {children}
    </div>
  );
}

export default ImageWithTextContent;

export const schema = createSchema({
  type: "image-with-text--content",
  title: "Content",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "select",
          name: "alignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ],
          },
          helpText:
            "This will override the default alignment setting of all children components.",
        },
      ],
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    alignment: "center",
    children: [
      {
        type: "subheading",
        content: "Subheading",
      },
      {
        type: "heading",
        content: "Heading for image",
        as: "h3",
      },
      {
        type: "paragraph",
        content: "Pair large text with an image to tell a story.",
        textSize: "sm",
      },
      {
        type: "button",
        text: "Discover now",
      },
    ],
  },
});
