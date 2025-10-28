import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

const variants = cva("grid h-full w-full items-start", {
  variants: {
    accordionLayout: {
      column: "grid-cols-1 md:grid-cols-2",
      row: "grid-cols-1 justify-center [&_.accordion--items]:max-w-[660px] [&_.accordion--items]:mx-auto",
    },
  },
  defaultVariants: {
    accordionLayout: "column",
  },
});

interface AccordionSectionProps
  extends SectionProps,
    VariantProps<typeof variants> {
  ref?: React.Ref<HTMLElement>;
}

const AccordionSection = (props: AccordionSectionProps) => {
  const { ref, accordionLayout, children, ...rest } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName={clsx(variants({ accordionLayout }))}
    >
      {children}
    </Section>
  );
};

export default AccordionSection;

export const schema: HydrogenComponentSchema = {
  type: "accordion",
  title: "Accordion",
  settings: [
    {
      group: "Accordion settings",
      inputs: [
        ...layoutInputs.filter((input) => input.name !== "borderRadius"),
        ...backgroundInputs.filter((input) => input.name !== "backgroundImage"),
      ],
    },
    {
      group: "Accordion layout",
      inputs: [
        {
          type: "toggle-group",
          name: "accordionLayout",
          label: "Accordion layout",
          defaultValue: "column",
          configs: {
            options: [
              { value: "column", label: "Column" },
              { value: "row", label: "Row" },
            ],
          },
        },
      ],
    },
  ],
  childTypes: ["accordion--info-group", "accordion--items"],
  presets: {
    gap: 16,
    children: [
      {
        type: "accordion--info-group",
      },
      {
        type: "accordion--items",
      },
    ],
  },
};
