import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ContactInfoGroupProps extends HydrogenComponentProps {
  gap?: number;
  ref?: React.Ref<HTMLDivElement>;
}

const ContactInfoGroup = (props: ContactInfoGroupProps) => {
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

export default ContactInfoGroup;

export const schema = createSchema({
  type: "accordion--info-group",
  title: "Information group",
  settings: [
    {
      group: "Content settings",
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
          defaultValue: 40,
        },
      ],
    },
  ],
  childTypes: ["accordion--header", "accordion--info-items"],
  presets: {
    gap: 40,
    children: [
      {
        type: "accordion--header",
        gap: 8,
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
      {
        type: "accordion--info-items",
        gap: 24,
        children: [
          {
            type: "accordion--info-item",
            label: "Email",
            value: "support@archercommerce.com",
            labelColor: "#000000",
            valueColor: "#666666",
            fontSize: 14,
          },
          {
            type: "accordion--info-item",
            label: "Hours",
            value: "Monday - Friday, 9AM - 5PM ET",
            labelColor: "#000000",
            valueColor: "#666666",
            fontSize: 14,
          },
          {
            type: "accordion--info-item",
            label: "Average response time",
            value: "1 Business day",
            labelColor: "#000000",
            valueColor: "#666666",
            fontSize: 14,
          },
        ],
      },
    ],
  },
});
