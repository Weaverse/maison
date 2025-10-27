import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ContactInfoHeaderProps extends HydrogenComponentProps {
  gap?: number;
  ref?: React.Ref<HTMLDivElement>;
}

const ContactInfoHeader = (props: ContactInfoHeaderProps) => {
  const { ref, children, gap, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-col"
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
};

export default ContactInfoHeader;

export const schema = createSchema({
  type: "accordion--header",
  title: "Header",
  settings: [
    {
      group: "Header settings",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Header spacing",
          configs: {
            min: 0,
            max: 40,
            step: 4,
            unit: "px",
          },
          defaultValue: 16,
        },
      ],
    },
  ],
  childTypes: ["heading", "paragraph"],
  presets: {
    gap: 16,
    children: [
      {
        type: "heading",
        content: "Customer Service",
        as: "h3",
        weight: 400,
        alignment: "left",
      },
      {
        type: "paragraph",
        content: "We offer support via email.",
        as: "p",
        width: "full",
        alignment: "left",
        textSize: "sm",
      },
    ],
  },
});
