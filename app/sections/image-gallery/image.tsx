import {
  createSchema,
  type HydrogenComponentProps,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { Image } from "~/components/image";

const variants = cva("relative overflow-hidden aspect-[16/9]", {
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

interface ImageGalleryItemProps
  extends HydrogenComponentProps,
    VariantProps<typeof variants> {
  src?: WeaverseImage;
  altText?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const ImageGalleryItem = forwardRef<HTMLDivElement, ImageGalleryItemProps>(
  (props, ref) => {
    const { src, altText, borderRadius, children } = props;

    const imageData =
      typeof src === "object" ? src : { url: src, altText: altText || "Image" };

    return (
      <div ref={ref} className={variants({ borderRadius })}>
        {src ? (
          <Image
            data={imageData}
            className="w-full h-full object-cover"
            data-motion="slide-in"
            loading="lazy"
            width={400}
            sizes="(min-width: 640px) 16.67vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">No image</span>
          </div>
        )}
        {children}
      </div>
    );
  },
);

export default ImageGalleryItem;

export const schema = createSchema({
  type: "image",
  title: "Image",
  childTypes: [],
  settings: [
    {
      group: "Image",
      inputs: [
        {
          type: "image",
          name: "src",
          label: "Image",
        },
        {
          type: "text",
          name: "altText",
          label: "Alt text",
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
