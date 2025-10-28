import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface LogoListProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

const LogoList = (props: LogoListProps) => {
  const { ref, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
};

export default LogoList;

export const schema = createSchema({
  type: "logo-list",
  title: "Logo list",
  childTypes: ["heading", "logo-list--items"],
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
        type: "heading",
        content: "Logos",
        as: "h4",
        weight: 400,
        alignment: "left",
      },
      {
        type: "logo-list--items",
        columns: "6",
        gap: 16,
        children: [
          {
            type: "logo-list--item",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "logo-list--item",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "logo-list--item",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "logo-list--item",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "logo-list--item",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
          {
            type: "logo-list--item",
            src: IMAGES_PLACEHOLDERS.image,
            altText: "#",
          },
        ],
      },
    ],
  },
});
