import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ContactInfoItemsProps extends HydrogenComponentProps {
  gap?: number;
  ref?: React.Ref<HTMLDivElement>;
}

const ContactInfoItems = (props: ContactInfoItemsProps) => {
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

export default ContactInfoItems;

export const schema = createSchema({
  type: "accordion--info-items",
  title: "Information items",
  settings: [
    {
      group: "Items settings",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
          configs: {
            min: 0,
            max: 40,
            step: 4,
            unit: "px",
          },
          defaultValue: 24,
        },
      ],
    },
  ],
  childTypes: ["accordion--info-item"],
  presets: {
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
});
