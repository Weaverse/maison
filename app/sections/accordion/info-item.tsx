import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ContactInfoItemProps extends HydrogenComponentProps {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
  fontSize: number;
  ref?: React.Ref<HTMLDivElement>;
}

const ContactInfoItem = (props: ContactInfoItemProps) => {
  const { ref, label, value, labelColor, valueColor, fontSize, ...rest } =
    props;

  return (
    <div
      ref={ref}
      style={{ fontSize: `${fontSize}px` }}
      data-motion="fade-up"
      {...rest}
    >
      <div style={{ color: labelColor }}>{label}</div>
      <div className="mt-1" style={{ color: valueColor }}>
        {value}
      </div>
    </div>
  );
};

export default ContactInfoItem;

export const schema = createSchema({
  type: "accordion--info-item",
  title: "Information item",
  settings: [
    {
      group: "Content settings",
      inputs: [
        {
          type: "text",
          name: "label",
          label: "Label",
          defaultValue: "Email",
          placeholder: "Enter label text",
        },
        {
          type: "text",
          name: "value",
          label: "Value",
          defaultValue: "support@archercommerce.com",
          placeholder: "Enter value text",
        },
        {
          type: "color",
          name: "labelColor",
          label: "Label color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "valueColor",
          label: "Value color",
          defaultValue: "#666666",
        },
        {
          type: "range",
          name: "fontSize",
          label: "Font Size",
          defaultValue: 16,
          configs: {
            min: 10,
            max: 24,
            step: 1,
            unit: "px",
          },
        },
      ],
    },
  ],
});
