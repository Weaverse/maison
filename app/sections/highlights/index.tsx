import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface HighlightsProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

export default function Highlights(props: HighlightsProps) {
  const { ref, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </Section>
  );
}

export const schema = createSchema({
  type: "highlights",
  title: "Highlights",
  childTypes: ["highlights--item"],
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
    backgroundColor: "#F9F8F7",
    children: [
      {
        type: "highlights--item",
        icon: "User",
        title: "Customer Support",
        description:
          "Our dedicated team provides timely assistance, committed to addressing your queries.",
      },
      {
        type: "highlights--item",
        icon: "CheckFat",
        title: "Guaranteed Quality",
        description:
          "Our dedicated team provides timely assistance, committed to addressing your queries.",
      },
      {
        type: "highlights--item",
        icon: "Package",
        title: "Fast Delivery",
        description:
          "Our dedicated team provides timely assistance, committed to addressing your queries.",
      },
    ],
  },
});
