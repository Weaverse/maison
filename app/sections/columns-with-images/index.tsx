import { createSchema } from "@weaverse/hydrogen";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";

interface ColumnsWithImagesProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function ColumnsWithImages(props: ColumnsWithImagesProps) {
  const { children, ref, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default ColumnsWithImages;

export const schema = createSchema({
  type: "columns-with-images",
  title: "Columns with images",
  // The corner radius lives on `Items`, where it rounds every image in the
  // row. The section's own radius rounds the section box — only visible with
  // a background on it — and two controls both labelled "Border radius"
  // a level apart is the confusion this section's review called out.
  settings: sectionSettings.map((group) =>
    group.group === "Layout"
      ? {
          ...group,
          inputs: group.inputs.filter((i) => i.name !== "borderRadius"),
        }
      : group,
  ),
  childTypes: [
    "columns-with-images--items",
    "subheading",
    "heading",
    "paragraph",
  ],
  presets: {
    gap: 48,
    children: [
      {
        type: "heading",
        content: "Columns with images",
      },
      {
        type: "columns-with-images--items",
      },
    ],
  },
});
