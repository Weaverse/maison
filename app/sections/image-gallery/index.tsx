import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface ImageGalleryProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

export default function ImageGallery(props: ImageGalleryProps) {
  const { ref, children, gap, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      <div
        className="flex flex-col"
        style={{ gap: gap != null ? `${gap}px` : undefined }}
      >
        {children}
      </div>
    </Section>
  );
}

export const schema = createSchema({
  type: "image-gallery",
  title: "Image gallery",
  childTypes: ["heading", "images"],
  settings: [
    {
      group: "Layout",
      inputs: [...layoutInputs.filter((i) => i.name !== "borderRadius")],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundImage" &&
            inp.name !== "backgroundFit" &&
            inp.name !== "backgroundPosition",
        ),
      ],
    },
  ],
  presets: {
    gap: 60,
    children: [
      {
        type: "heading",
        content: "Images",
        as: "h4",
        weight: 400,
        alignment: "left",
      },
      {
        type: "images",
        columns: "6",
        gap: 16,
        children: [
          {
            type: "image",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "image",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "image",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "image",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "image",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "image",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
        ],
      },
    ],
  },
});
