import { createSchema } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

const variants = cva("flex flex-col items-center", {
  variants: {
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
    gap: 16,
  },
});

interface ContactFormProps extends VariantProps<typeof variants>, SectionProps {
  ref?: React.Ref<HTMLElement>;
}

export default function ContactForm(props: ContactFormProps) {
  const { ref, children, gap, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      <div className={variants({ gap })}>{children}</div>
    </Section>
  );
}

export const schema = createSchema({
  type: "contact-form",
  title: "Contact form",
  childTypes: [
    "heading",
    "subheading",
    "contact-form-fields",
    "button",
    "paragraph",
  ],
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
    gap: 16,
    children: [
      {
        type: "heading",
        content: "Contact Us",
        as: "h4",
        weight: 400,
        alignment: "center",
      },
      {
        type: "subheading",
        content: "Complete the form to contact us",
        alignment: "center",
      },
      {
        type: "contact-form-fields",
      },
      {
        type: "button",
        text: "Submit",
        variant: "primary",
        alignment: "center",
      },
      {
        type: "paragraph",
        content:
          "By submitting you have read and agree to the Terms of Use and Privacy Policy.",
        alignment: "center",
        textSize: "xs",
      },
    ],
  },
});
