import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface ContactFormProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

export default function ContactForm(props: ContactFormProps) {
  const { ref, children, ...rest } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName="flex flex-col items-center"
    >
      {children}
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
      inputs: [
        ...layoutInputs.filter(
          (i) => i.name !== "borderRadius" && i.name !== "gap",
        ),
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
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
