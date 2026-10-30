import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Image } from "~/components/image";
import Link, { type LinkProps, linkContentInputs } from "~/components/link";

const variants = cva("", {
  variants: {
    size: {
      large: "col-span-6",
      medium: "col-span-4",
    },
    hideOnMobile: {
      true: "hidden sm:block",
      false: "",
    },
  },
});

interface ColumnWithImageItemProps
  extends VariantProps<typeof variants>,
    Pick<LinkProps, "variant" | "text" | "to">,
    HydrogenComponentProps {
  imageSrc: WeaverseImage;
  heading: string;
  content: string;
  ref?: React.Ref<HTMLDivElement>;
}

function ColumnWithImageItem(props: ColumnWithImageItemProps) {
  const {
    imageSrc,
    heading,
    content,
    text,
    to,
    variant,
    hideOnMobile,
    size,
    ref,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      {...rest}
      data-motion="slide-in"
      className={variants({ size, hideOnMobile })}
    >
      {/* `--image-aspect-ratio` and `--radius` are both set once on the
          parent `Items`, so every column in the row shares them. */}
      <Image
        data={typeof imageSrc === "object" ? imageSrc : { url: imageSrc }}
        sizes="auto"
        className="aspect-(--image-aspect-ratio) h-auto rounded-(--radius)"
        aspectRatio={undefined}
      />
      <div className="mt-6 w-full space-y-3.5 text-center">
        {heading && <h6>{heading}</h6>}
        {content && <p dangerouslySetInnerHTML={{ __html: content }} />}
        {text && (
          <Link variant={variant} to={to}>
            {text}
          </Link>
        )}
      </div>
    </div>
  );
}

export default ColumnWithImageItem;

export const schema = createSchema({
  type: "column-with-image--item",
  title: "Column",
  settings: [
    {
      group: "Column",
      inputs: [
        {
          type: "select",
          name: "size",
          label: "Column size",
          configs: {
            options: [
              {
                label: "Large",
                value: "large",
              },
              {
                label: "Medium",
                value: "medium",
              },
            ],
          },
          defaultValue: "medium",
        },
        {
          type: "switch",
          label: "Hide on Mobile",
          name: "hideOnMobile",
          defaultValue: false,
        },
        {
          type: "heading",
          label: "Image",
        },
        {
          type: "image",
          name: "imageSrc",
          label: "Image",
        },
        {
          type: "heading",
          label: "Content",
        },
        {
          type: "text",
          name: "heading",
          label: "Heading",
          placeholder: "Example heading",
          defaultValue: "Example heading",
        },
        {
          type: "richtext",
          label: "Description",
          name: "content",
          placeholder:
            "Use this section to promote content throughout every page of your site. Add images for further impact.",
          defaultValue:
            "Use this section to promote content throughout every page of your site. Add images for further impact.",
        },

        {
          type: "heading",
          label: "Button (optional)",
        },
        ...linkContentInputs,
      ],
    },
  ],
  presets: {
    imageSrc: IMAGES_PLACEHOLDERS.product_4,
  },
});
