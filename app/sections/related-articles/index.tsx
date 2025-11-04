import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface RelatedArticlesProps extends SectionProps {
  ref: React.Ref<HTMLElement>;
}

export default function RelatedArticles(props: RelatedArticlesProps) {
  const { ref, children, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export const schema = createSchema({
  type: "related-articles",
  title: "Related articles",
  limit: 1,
  enabledOn: {
    pages: ["ARTICLE"],
  },
  childTypes: ["related-articles--header", "related-articles--items"],
  settings: [
    {
      group: "Layout",
      inputs: [...layoutInputs.filter((i) => i.name !== "borderRadius")],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (i) =>
            i.name !== "backgroundImage" &&
            i.name !== "backgroundFit" &&
            i.name !== "backgroundPosition",
        ),
      ],
    },
  ],
  presets: {
    gap: 40,
    children: [
      {
        type: "related-articles--header",
        gap: 16,
        children: [
          {
            type: "heading",
            content: "Related articles",
            as: "h4",
            weight: 400,
            alignment: "left",
          },
          {
            type: "view-all-button",
            text: "VIEW ALL",
            link: "/blogs",
            showButton: true,
          },
        ],
      },
      {
        type: "related-articles--items",
        gap: 16,
        mobileGridSize: "2",
        desktopGridSize: "4",
        imageAspectRatio: "1/1",
        showAuthor: true,
        showDate: true,
        showExcerpt: false,
        showReadmore: false,
        imageBorderRadius: 4,
        articlesToShow: 4,
      },
    ],
  },
});
