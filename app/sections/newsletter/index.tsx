import { createSchema } from "@weaverse/hydrogen";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";

interface NewsLetterProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function NewsLetter(props: NewsLetterProps) {
  const { children, ref, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default NewsLetter;

export const schema = createSchema({
  type: "newsletter",
  title: "Newsletter",
  settings: sectionSettings,
  childTypes: ["subheading", "heading", "paragraph", "newsletter--form"],
  presets: {
    gap: 20,
    children: [
      {
        type: "heading",
        content: "Newsletter",
        as: "h3",
      },
      {
        type: "paragraph",
        content:
          "Be the first to know about new collections and exclusive offers.",
        textSize: "sm",
      },
      { type: "newsletter--form" },
    ],
  },
});
