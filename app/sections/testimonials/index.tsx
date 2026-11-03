import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface TestimonialsProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function Testimonials(props: TestimonialsProps) {
  const { children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest} overflow="unset">
      {children}
    </Section>
  );
}

export default Testimonials;

export const schema = createSchema({
  type: "testimonials",
  title: "Testimonials",
  childTypes: ["testimonials--header", "testimonials-items"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.map((input) =>
        input.name === "gap" ? { ...input, defaultValue: 60 } : input,
      ),
    },
    { group: "Background", inputs: backgroundInputs },
    { group: "Overlay", inputs: overlayInputs },
  ],
  presets: {
    children: [
      {
        type: "testimonials--header",
        children: [
          {
            type: "heading",
            content: "Testimonials",
          },
          {
            type: "paragraph",
            content:
              "Pair this section with a short line about what customers say, then replace each card with a real review.",
          },
        ],
      },
      {
        type: "testimonials-items",
        children: [
          {
            type: "testimonial--item",
            authorName: "Author name",
            authorTitle: "Author title",
            authorImage: IMAGES_PLACEHOLDERS.image,
            content:
              "Add a short customer quote here. Keep it to one or two sentences so the card stays readable.",
          },
          {
            type: "testimonial--item",
            authorName: "Author name",
            authorTitle: "Author title",
            authorImage: IMAGES_PLACEHOLDERS.image,
            content:
              "Add a short customer quote here. Keep it to one or two sentences so the card stays readable.",
          },
          {
            type: "testimonial--item",
            authorName: "Author name",
            authorTitle: "Author title",
            authorImage: IMAGES_PLACEHOLDERS.image,
            content:
              "Add a short customer quote here. Keep it to one or two sentences so the card stays readable.",
          },
          {
            type: "testimonial--item",
            authorName: "Author name",
            authorTitle: "Author title",
            authorImage: IMAGES_PLACEHOLDERS.image,
            content:
              "Add a short customer quote here. Keep it to one or two sentences so the card stays readable.",
          },
          {
            type: "testimonial--item",
            authorName: "Author name",
            authorTitle: "Author title",
            authorImage: IMAGES_PLACEHOLDERS.image,
            content:
              "Add a short customer quote here. Keep it to one or two sentences so the card stays readable.",
          },
          {
            type: "testimonial--item",
            authorName: "Author name",
            authorTitle: "Author title",
            authorImage: IMAGES_PLACEHOLDERS.image,
            content:
              "Add a short customer quote here. Keep it to one or two sentences so the card stays readable.",
          },
        ],
      },
    ],
  },
});
