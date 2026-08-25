import { createSchema } from "@weaverse/hydrogen";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";

interface RichTextProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function RichText(props: RichTextProps) {
  const { children, ref, ...rest } = props;

  return (
    // The button is an inline-flex box with no alignment setting of its own, so
    // it follows the container's text-align. Heading and paragraph each stamp
    // their own `text-*` class, so this only centers the button.
    <Section ref={ref} {...rest} containerClassName="text-center">
      {children}
    </Section>
  );
}

export default RichText;

export const schema = createSchema({
  type: "rich-text",
  title: "Rich text",
  settings: sectionSettings,
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    // Figma node 4592:11479 — 660px centered text column, 24px stack,
    // gradient background from `Rectangle 1836` (4592:11483).
    width: "custom",
    customWidth: 660,
    gap: 24,
    verticalPadding: "medium",
    enableOverlay: true,
    overlayType: "gradient",
    gradientDirection: "to top",
    gradientFrom: "#EFECE5",
    gradientTo: "#E1D5CE",
    gradientToOpacity: 25,
    children: [
      {
        type: "heading",
        content: "Cloud like sofas that support relaxing anytime",
        as: "h3",
        alignment: "center",
        color: "#7B7165",
      },
      {
        type: "paragraph",
        content:
          "A thoughtfully designed, curated furniture collection—made for real life.",
        alignment: "center",
        color: "#7B7165",
      },
      {
        type: "button",
        text: "Discover Now",
        variant: "custom",
        backgroundColor: "#8A7F68",
        textColor: "#F1EEEA",
        borderColor: "#8A7F68",
        backgroundColorHover: "#F1EEEA",
        textColorHover: "#8A7F68",
        borderColorHover: "#8A7F68",
      },
    ],
  },
});
