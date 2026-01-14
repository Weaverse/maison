import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import {
  createSchema,
  type WeaverseImage,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import type { OverlayProps } from "~/components/overlay";
import { Overlay, overlayInputs } from "~/components/overlay";

interface CompanyStoryImageData extends OverlayProps {
  heroImage?: WeaverseImage | string;
  altText?: string;
}

interface CompanyStoryImageProps
  extends HydrogenComponentProps,
  CompanyStoryImageData {
  ref?: React.Ref<HTMLDivElement>;
}

const CompanyStoryImage = (props: CompanyStoryImageProps) => {
  const {
    ref,
    heroImage,
    altText,
    enableOverlay,
    overlayType,
    overlayColor,
    overlayColorHover,
    overlayOpacity,
    gradientDirection,
    gradientFrom,
    gradientTo,
    gradientToOpacity,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="relative h-[280px] w-full overflow-hidden rounded-t-[4px]"
    >
      {heroImage ? (
        <>
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
          <Overlay
            enableOverlay={enableOverlay}
            overlayType={overlayType}
            overlayColor={overlayColor}
            overlayColorHover={overlayColorHover}
            overlayOpacity={overlayOpacity}
            gradientDirection={gradientDirection}
            gradientFrom={gradientFrom}
            gradientTo={gradientTo}
            gradientToOpacity={gradientToOpacity}
            className="z-[1]"
          />
        </>
      ) : (
        <Image
          data={{
            url: IMAGES_PLACEHOLDERS.banner_2,
            altText: "Company story hero image",
          }}
          className="size-full object-cover"
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
    {
      group: "Overlay",
      inputs: overlayInputs,
    },
  ],
});
