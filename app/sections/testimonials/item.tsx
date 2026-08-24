import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";

interface TestimonialItemProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  content: string;
  image: WeaverseImage;
  badgeText: string;
  badgeBackgroundColor?: string;
  authorImage: WeaverseImage;
  authorName: string;
  authorTitle: string;
}

function resolveImage(value: WeaverseImage | string, altText: string) {
  return typeof value === "object" ? value : { url: value, altText };
}

export default function TestimonialItem(props: TestimonialItemProps) {
  const {
    ref,
    content,
    image,
    badgeText,
    badgeBackgroundColor,
    authorImage,
    authorName,
    authorTitle,
    ...rest
  } = props;

  return (
    <div ref={ref} {...rest} data-motion="slide-in" className="h-full">
      <figure className="flex h-full flex-col items-start justify-start gap-6 rounded-[16px] border border-line p-6 text-body">
        <figcaption className="flex w-full items-center gap-2.5">
          <Image
            alt={authorName}
            className="size-9 shrink-0 rounded-[8px] object-cover"
            data={resolveImage(authorImage, authorName)}
            sizes="auto"
            width={36}
          />
          <div className="flex flex-col justify-center gap-0.5 whitespace-nowrap">
            <div className="font-semibold text-base leading-[1.6] tracking-[0.28px]">
              {authorName}
            </div>
            <div className="text-sm leading-none tracking-[0.24px]">
              {authorTitle}
            </div>
          </div>
        </figcaption>

        <div className="w-full overflow-hidden rounded-[12px]">
          <Image
            alt={authorName}
            aspectRatio="1/1"
            className="w-full object-cover"
            data={resolveImage(image, authorName)}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>

        {badgeText ? (
          <div
            className="flex w-fit items-center justify-center rounded-[8px] px-5 py-1.5"
            style={{ backgroundColor: badgeBackgroundColor }}
          >
            <span className="whitespace-nowrap text-base leading-[1.6] tracking-[0.28px]">
              {badgeText}
            </span>
          </div>
        ) : null}

        <blockquote className="flex w-full items-center">
          <p
            className="min-w-0 flex-1 text-base leading-[1.6] tracking-[0.28px]"
            dangerouslySetInnerHTML={{ __html: content }}
            suppressHydrationWarning
          />
        </blockquote>
      </figure>
    </div>
  );
}

export const schema = createSchema({
  type: "testimonial--item",
  title: "Testimonial",
  settings: [
    {
      group: "Testimonial",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Image",
          defaultValue: IMAGES_PLACEHOLDERS.product_1,
        },
        {
          type: "text",
          name: "badgeText",
          label: "Badge",
          defaultValue: "Pillow",
          placeholder: "Product or category",
        },
        {
          type: "color",
          name: "badgeBackgroundColor",
          label: "Badge background",
          defaultValue: "#EBEAE5",
        },
        {
          type: "textarea",
          name: "content",
          label: "Content",
          defaultValue: `Stay organized with our spacious wardrobes. Tailored to fit your needs, these storage solutions offer a perfect blend of style.`,
          placeholder: "Testimonial content",
        },
        {
          type: "image",
          name: "authorImage",
          label: "Author image",
          defaultValue: IMAGES_PLACEHOLDERS.image,
        },
        {
          type: "text",
          name: "authorName",
          label: "Author Name",
          defaultValue: "Emily Lee",
          placeholder: "Author name",
        },
        {
          type: "text",
          name: "authorTitle",
          label: "Author Title",
          defaultValue: "Housewife",
          placeholder: "Author title",
        },
      ],
    },
  ],
});
