import { createSchema } from "@weaverse/hydrogen";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface CollectionListProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function CollectionList(props: CollectionListProps) {
  const { children, ref, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default CollectionList;

export const schema = createSchema({
  type: "collection-list",
  title: "Collection list",
  limit: 1,
  childTypes: ["subheading", "heading", "paragraph", "collections-items"],
  enabledOn: {
    pages: ["COLLECTION_LIST"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((input) => input.name !== "borderRadius"),
    },
  ],
  presets: {
    gap: 60,
    children: [
      {
        type: "heading",
        content: "Collections",
      },
      {
        type: "collections-items",
        prevButtonText: "↑ Load previous",
        nextButtonText: "Load more ↓",
        mobileGridSize: "2",
        desktopGridSize: "5",
        gap: 16,
        imageAspectRatio: "1/1",
        imageBorderRadius: 4,
        showProductCount: true,
        cardBackgroundColor: "#DCDCDC",
        cardPadding: 12,
        cardBorderRadius: 4,
      },
    ],
  },
});
