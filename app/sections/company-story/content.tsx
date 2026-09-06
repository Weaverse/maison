import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";

interface CompanyStoryContentData {
  contentBackgroundColor?: string;
}

interface CompanyStoryContentProps
  extends HydrogenComponentProps,
    CompanyStoryContentData {
  ref?: React.Ref<HTMLDivElement>;
}

const CompanyStoryContent = (props: CompanyStoryContentProps) => {
  const { ref, contentBackgroundColor, children, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="px-5 py-10 md:px-20"
      style={{
        backgroundColor: contentBackgroundColor,
      }}
    >
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default CompanyStoryContent;

export const schema = createSchema({
  type: "company-story--content",
  title: "Content",
  childTypes: ["heading", "paragraph"],
  settings: [
    {
      group: "Background",
      inputs: [
        {
          type: "color",
          name: "contentBackgroundColor",
          label: "Content background color",
          defaultValue: "#FFFFFF",
        },
      ],
    },
  ],
  presets: {
    children: [
      { type: "heading", content: "Heading", alignment: "left" },
      { type: "paragraph", width: "full", alignment: "left" },
    ],
  },
});
