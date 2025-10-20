import { createSchema } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

export interface RichTextProps
  extends VariantProps<typeof variants>,
    SectionProps {
  ref?: React.Ref<HTMLElement>;
}

const variants = cva(
  "flex flex-col [&_.paragraph]:mx-[unset] [&_.heading]:max-w-[660px]",
  {
    variants: {
      height: {
        small: "min-h-[40vh] lg:min-h-[50vh]",
        medium: "min-h-[50vh] lg:min-h-[60vh]",
        large: "min-h-[70vh] lg:min-h-[80vh]",
        full: "min-h-screen",
      },
      contentPosition: {
        "top left": "items-start justify-start [&_.paragraph]:text-left",
        "top center": "items-center justify-start [&_.paragraph]:text-center",
        "top right": "items-end justify-start [&_.paragraph]:text-right",
        "center left": "items-start justify-center [&_.paragraph]:text-left",
        "center center":
          "items-center justify-center [&_.paragraph]:text-center",
        "center right": "items-end justify-center [&_.paragraph]:text-right",
        "bottom left": "items-start justify-end [&_.paragraph]:text-left",
        "bottom center": "items-center justify-end [&_.paragraph]:text-center",
        "bottom right": "items-end justify-end [&_.paragraph]:text-right",
      },
    },
    defaultVariants: {
      height: "medium",
      contentPosition: "center center",
    },
  },
);

export default function RichText(props: RichTextProps) {
  const { ref, children, height, contentPosition, ...rest } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName={variants({ contentPosition, height })}
    >
      {children}
    </Section>
  );
}

export const schema = createSchema({
  type: "rich-text",
  title: "Rich text",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "height",
          label: "Section height",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "full", label: "Fullscreen" },
            ],
          },
        },
        {
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center center",
        },
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundFor" && inp.name !== "backgroundColor",
        ),
      ],
    },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: ["heading", "paragraph", "button"],
  presets: {
    height: "medium",
    contentPosition: "center center",
    enableOverlay: true,
    gap: 24,
    children: [
      {
        type: "heading",
        content: "Cloud like sofas that support relaxing anytime",
        as: "h3",
        weight: 400,
      },
      {
        type: "paragraph",
        content:
          "A thoughtfully designed, curated furniture collection—made for real life.",
        width: "fixed",
        maxWidth: 660,
        textSize: "base",
      },
      {
        type: "button",
        text: "Discover Now",
        variant: "primary",
      },
    ],
  },
});
