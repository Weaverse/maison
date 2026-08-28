import { createSchema } from "@weaverse/hydrogen";
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
              "We are a team of passionate people whose goal is to improve everyone's life through disruptive products. We build great products to solve your business problems.",
          },
        ],
      },
      {
        type: "testimonials-items",
        children: [
          {
            type: "testimonial--item",
            authorName: "Glen P.",
            authorTitle: "Founder, eCom Graduates",
            authorImage:
              "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/glen_p.webp?v=1711343796",
            content:
              "I run a Shopify development agency and this is the kind of tool I've been looking for. Clients do not understand why headless is rather expensive to build but having a tool/option like this is a game changer. ",
          },
          {
            type: "testimonial--item",
            authorName: "Tom H.",
            authorTitle: "Owner, On The Road UK",
            authorImage:
              "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/tom_h.webp?v=1711343959",
            content:
              "I love how intuitive the tool is. It looks very promising for my potential clients, and being able to easily use meta objects with this is a big plus.",
          },
          {
            type: "testimonial--item",
            authorName: "Kenneth G.",
            authorTitle: "Frontend Developer, DevInside Agency",
            authorImage:
              "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/Kenneth_g.webp?v=1711359007",
            content:
              "We already love the Shopify theme editor, so having something similar for Hydrogen is so cool because now we can get hydrogen storefront setup similar to a liquid store.",
          },
          {
            type: "testimonial--item",
            authorName: "Leonardo G.",
            authorTitle: "Solo developer",
            authorImage:
              "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/leo_1.webp?v=1711359106",
            content:
              "As a solo dev with a small Shopify shop, this is something interesting to hear about. I'm migrating from a GatsbyJS headless to Hydrogen solution, and Weaverse makes it a lot easier because I want to avoid hydrogen-react with NextJS!",
          },
          {
            type: "testimonial--item",
            authorName: "Micky M.",
            authorTitle: "Owner, Joylery Silver",
            authorImage:
              "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/micky_m.webp?v=1711359054",
            content:
              "We struggled with site speed and as an ex-developer, I wanted to go headless but with only one in-house developer, it seemed impossible. Weaverse really made going headless a lot more accessible.",
          },
          {
            type: "testimonial--item",
            authorName: "John D.",
            authorTitle: "CEO, Tech Solutions",
            authorImage:
              "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/glen_p.webp?v=1711343796",
            content:
              "As a tech company CEO, this tool has revolutionized how we approach development. It's intuitive, efficient, and has made our processes significantly more streamlined.",
          },
        ],
      },
    ],
  },
});
