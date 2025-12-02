import * as RadixAccordion from "@radix-ui/react-accordion";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import { useAnimation } from "~/hooks/use-animation";

interface AccordionGroupProps extends HydrogenComponentProps {
  allowMultiple: boolean;
  gap?: number;
  ref?: React.Ref<HTMLDivElement>;
}

const AccordionGroup = (props: AccordionGroupProps) => {
  const { ref, children, gap, ...rest } = props;
  const [scope] = useAnimation(ref);

  return (
    <div ref={scope} {...rest}>
      <RadixAccordion.Root
        type="multiple"
        className="accordion--items grid w-full"
        style={{ gap: `${gap}px` }}
      >
        {children}
      </RadixAccordion.Root>
    </div>
  );
};

export default AccordionGroup;

export const schema: HydrogenComponentSchema = {
  type: "accordion--items",
  title: "Accordion items",
  settings: [
    {
      group: "Accordion settings",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 16,
        },
      ],
    },
  ],
  childTypes: ["accordion--item"],
  presets: {
    children: [
      {
        type: "accordion--item",
        icon: "truck",
      },
      {
        type: "accordion--item",
        icon: "paint-brush-household",
      },
      {
        type: "accordion--item",
        icon: "ruler",
      },
      {
        type: "accordion--item",
        icon: "package",
      },
    ],
  },
};
