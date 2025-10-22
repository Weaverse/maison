import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface InformationItemProps extends HydrogenComponentProps {
  label: string;
  value: string;
  textColor: string;
  fontSize: number;
  ref?: React.Ref<HTMLDivElement>;
}

const InformationItem = (props: InformationItemProps) => {
  const { ref, label, value, textColor, fontSize, ...rest } = props;

  return (
    <div
      ref={ref}
      style={{ fontSize: `${fontSize}px`, color: textColor }}
      data-motion="fade-up"
      {...rest}
    >
      <div>{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
};

export default InformationItem;

export const schema = createSchema({
  type: "information--item",
  title: "Information Item",
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
          name: "textColor",
          label: "Information text color",
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
