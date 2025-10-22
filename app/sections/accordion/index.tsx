import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

const variants = cva("grid h-full w-full items-start", {
  variants: {
    accordionLayout: {
      column: "grid-cols-1 md:grid-cols-2",
      row: "grid-cols-1 justify-center [&_.accordion--group]:max-w-[660px] [&_.accordion--group]:mx-auto",
    },
    gap: {
      0: "gap-0",
      4: "gap-1",
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
      36: "gap-9",
      40: "gap-10",
      44: "gap-11",
      48: "gap-12",
      52: "gap-[52px]",
      56: "gap-14",
      60: "gap-[60px]",
    },
  },
  defaultVariants: {
    accordionLayout: "column",
    gap: 16,
  },
});

// Accordion Section Props
interface AccordionSectionProps
  extends SectionProps,
    VariantProps<typeof variants> {
  accordionLayout: "column" | "row";
}

const AccordionSection = (props: AccordionSectionProps) => {
  const { ref, accordionLayout, gap, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      <div className={clsx(variants({ accordionLayout, gap }))}>{children}</div>
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
        ...layoutInputs.filter((input) => input.name !== "gap"),
        ...backgroundInputs,
        ...overlayInputs,
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
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
  ],
  childTypes: ["content-information", "accordion-group"],
  presets: {
    gap: 16,
    children: [
      {
        type: "content-information",
      },
      {
        type: "accordion-group",
      },
    ],
  },
};
