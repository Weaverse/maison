import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section } from "~/components/section";

interface CompanyStoryProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLElement>;
}

function CompanyStory(props: CompanyStoryProps) {
  const { ref, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {/* Border/radius-md on the card itself, clipping the blocks inside it. */}
      <div className="overflow-hidden rounded-2xl">{children}</div>
    </Section>
  );
}

export default CompanyStory;

export const schema = createSchema({
  type: "company-story",
  title: "Company story",
  childTypes: [
    "company-story--image",
    "company-story--content",
    "company-story--separator",
    "company-story--contact",
  ],
  settings: [
    {
      group: "Layout",
      inputs: [
        ...layoutInputs.filter(
          (i) => i.name !== "borderRadius" && i.name !== "gap",
        ),
      ],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (input) =>
            input.name !== "backgroundFor" && input.name !== "backgroundImage",
        ),
      ],
    },
  ],
  presets: {
    children: [
      { type: "company-story--image" },
      { type: "company-story--content" },
      { type: "company-story--separator" },
      { type: "company-story--contact" },
    ],
  },
});
