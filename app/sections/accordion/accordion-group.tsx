import * as RadixAccordion from "@radix-ui/react-accordion";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";

interface AccordionGroupProps extends HydrogenComponentProps {
  allowMultiple: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const AccordionGroup = (props: AccordionGroupProps) => {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest}>
      <RadixAccordion.Root
        type="multiple"
        className="accordion--group grid w-full gap-4"
      >
        {children}
      </RadixAccordion.Root>
    </div>
  );
};

export default AccordionGroup;

export const schema: HydrogenComponentSchema = {
  type: "accordion--group",
  title: "Accordion Group",
  settings: [
    {
      group: "Accordion settings",
      inputs: [],
    },
  ],
  childTypes: ["accordion--item", "subheading", "heading", "paragraph"],
  presets: {
    children: [
      {
        type: "accordion--item",
        icon: "truck",
        title: "How long furniture delivery takes?",
        content:
          "Products are imported automatically from your Shopify admin. We estimate 2-3 hours for set-up. If you want to change the design of Honey, we estimate 3-5 hours for set-up.",
      },
      {
        type: "accordion--item",
        icon: "paint-brush-household",
        title: "How long customizable are the products?",
        content:
          "You can customize text, colors, and materials within your Shopify editor. Simple changes usually take 1–2 hours. For advanced layout or section redesigns, expect 3–5 hours.",
      },
      {
        type: "accordion--item",
        icon: "ruler",
        title: "Do shopping fees change according to sizes?",
        content:
          "Yes, we offer a discount for larger sizes. Contact our customer service team to learn more about our size-specific discounts.",
      },
      {
        type: "accordion--item",
        icon: "package",
        title: "What is the product return policy?",
        content:
          "We offer a 30-day return policy for all unused items in their original packaging. Contact our customer service team to initiate a return.",
      },
    ],
  },
};
