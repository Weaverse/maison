import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import { Link } from "~/components/link";

interface InstagramItemProps extends HydrogenComponentProps {
  image?: WeaverseImage | string;
  link?: string;
  ref?: React.Ref<HTMLDivElement>;
}

function resolveImage(value?: WeaverseImage | string) {
  if (!value) {
    return { url: IMAGES_PLACEHOLDERS.image, altText: "Instagram post" };
  }
  if (typeof value === "string") {
    return { url: value, altText: "Instagram post" };
  }
  return value;
}

const InstagramItem = (props: InstagramItemProps) => {
  const { ref, image, link, ...rest } = props;
  const imageData = resolveImage(image);

  const thumb = (
    <div className="aspect-square w-full overflow-hidden rounded-[16px]">
      <Image
        alt={imageData.altText || "Instagram post"}
        aspectRatio="1/1"
        className="h-full w-full object-cover"
        data={imageData}
        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
      />
    </div>
  );

  return (
    <div ref={ref} {...rest} className="w-full">
      {link ? (
        <Link className="block w-full" target="_blank" to={link}>
          {thumb}
        </Link>
      ) : (
        thumb
      )}
    </div>
  );
};

export default InstagramItem;

export const schema = createSchema({
  type: "instagram--item",
  title: "Instagram post",
  settings: [
    {
      group: "Post",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Image",
        },
        {
          type: "text",
          name: "link",
          label: "Post link",
          placeholder: "https://www.instagram.com/p/...",
          helpText:
            "Open the post on Instagram, copy its link, and paste it here.",
        },
      ],
    },
  ],
});
