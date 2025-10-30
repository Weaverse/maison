import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import {
  createSchema,
  type WeaverseImage,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";

interface CompanyStoryImageData {
  heroImage?: WeaverseImage | string;
  altText?: string;
}

interface CompanyStoryImageProps
  extends HydrogenComponentProps,
    CompanyStoryImageData {
  ref?: React.Ref<HTMLDivElement>;
}

const CompanyStoryImage = (props: CompanyStoryImageProps) => {
  const { ref, heroImage, altText, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="relative h-[280px] w-full overflow-hidden"
    >
      {heroImage ? (
        <div className="relative size-full">
          <Image
            data={
              typeof heroImage === "string"
                ? { url: heroImage, altText }
                : { ...heroImage, altText }
            }
            className="size-full object-cover"
            loading="eager"
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-[rgba(155,141,73,0.24)]" />
        </div>
      ) : (
        <Image
          data={{
            url: IMAGES_PLACEHOLDERS.banner_2,
            altText: "Company story hero image",
          }}
          className="size-full border border-[#DCDCDC] object-cover"
          loading="eager"
          sizes="100vw"
        />
      )}
    </div>
  );
};

export default CompanyStoryImage;

export const schema = createSchema({
  type: "company-story--image",
  title: "Image",
  settings: [
    {
      group: "Hero image",
      inputs: [
        {
          type: "image",
          name: "heroImage",
          label: "Select an image",
        },
        {
          type: "text",
          name: "altText",
          label: "Alt text",
          defaultValue: "Company story hero image",
        },
      ],
    },
  ],
});
