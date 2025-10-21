import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface MulticolumnProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

export default function Multicolumn(props: MulticolumnProps) {
  const { ref, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export const schema = createSchema({
  type: "multicolumn",
  title: "Multicolumn",
  childTypes: ["multicolumn-header", "multicolumn-items"],
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
        type: "multicolumn-header",
        gap: 16,
        children: [
          {
            type: "heading",
            content: "Heading",
            as: "h4",
            weight: 400,
            alignment: "left",
          },
          {
            type: "view-all-button",
            text: "VIEW ALL",
            link: "/services",
            showButton: true,
          },
        ],
      },
      {
        type: "multicolumn-items",
        columns: "4",
        gap: 16,
        children: [
          {
            type: "multicolumn-item",
            backgroundColor: "#DCDCDC",
            borderRadius: 4,
            children: [
              {
                type: "heading",
                content: "Heading",
                as: "h6",
                weight: "400",
                alignment: "left",
              },
              {
                type: "paragraph",
                content:
                  "Provide content for your customers that sets their business up for success",
                alignment: "left",
                width: "full",
                textSize: "sm",
              },
              {
                type: "button",
                text: "Discover Now",
                variant: "secondary",
              },
            ],
          },
          {
            type: "multicolumn-item",
            backgroundColor: "#DCDCDC",
            borderRadius: 4,
            children: [
              {
                type: "heading",
                content: "Heading",
                as: "h6",
                weight: "400",
                alignment: "left",
              },
              {
                type: "paragraph",
                content:
                  "Provide content for your customers that sets their business up for success",
                alignment: "left",
                width: "full",
                textSize: "sm",
              },
              {
                type: "button",
                text: "Discover Now",
                variant: "secondary",
              },
            ],
          },
          {
            type: "multicolumn-item",
            backgroundColor: "#DCDCDC",
            borderRadius: 4,
            children: [
              {
                type: "heading",
                content: "Heading",
                as: "h6",
                weight: "400",
                alignment: "left",
              },
              {
                type: "paragraph",
                content:
                  "Provide content for your customers that sets their business up for success",
                alignment: "left",
                width: "full",
                textSize: "sm",
              },
              {
                type: "button",
                text: "Discover Now",
                variant: "secondary",
              },
            ],
          },
          {
            type: "multicolumn-item",
            backgroundColor: "#DCDCDC",
            borderRadius: 4,
            children: [
              {
                type: "heading",
                content: "Heading",
                as: "h6",
                weight: "400",
                alignment: "left",
              },
              {
                type: "paragraph",
                content:
                  "Provide content for your customers that sets their business up for success",
                alignment: "left",
                width: "full",
                textSize: "sm",
              },
              {
                type: "button",
                text: "Discover Now",
                variant: "secondary",
              },
            ],
          },
        ],
      },
    ],
  },
});
