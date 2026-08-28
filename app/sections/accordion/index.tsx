import type { HydrogenComponentSchema } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

const variants = cva("grid h-full w-full items-start", {
  variants: {
    desktopColumns: {
      "1": "mx-auto max-w-[660px] grid-cols-1 md:grid-cols-1",
      "2": "grid-cols-1 md:grid-cols-2",
    },
  },
  defaultVariants: {
    desktopColumns: "2",
  },
});

interface AccordionSectionProps
  extends SectionProps,
    VariantProps<typeof variants> {
  accordionLayout?: "column" | "row";
  ref?: React.Ref<HTMLElement>;
}

const AccordionSection = (props: AccordionSectionProps) => {
  const { ref, accordionLayout, desktopColumns, children, ...rest } = props;
  const resolvedDesktopColumns =
    desktopColumns ?? (accordionLayout === "row" ? "1" : "2");

  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName={clsx(
        variants({ desktopColumns: resolvedDesktopColumns }),
      )}
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
          type: "select",
          name: "desktopColumns",
          label: "Desktop columns",
          defaultValue: "2",
          configs: {
            options: [
              { value: "1", label: "1 column" },
              { value: "2", label: "2 columns" },
            ],
          },
        },
      ],
    },
  ],
  childTypes: ["accordion--info-group", "accordion--items"],
  presets: {
    gap: 16,
    desktopColumns: "2",
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
