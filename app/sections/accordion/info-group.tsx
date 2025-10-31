import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface InfoGroupProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

const InfoGroup = (props: InfoGroupProps) => {
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

export default InfoGroup;

export const schema = createSchema({
  type: "accordion--info-group",
  title: "Information group",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Item spacing",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 8,
        },
      ],
    },
  ],
  childTypes: ["heading", "subheading", "paragraph"],
  presets: {
    children: [
      {
        type: "heading",
        as: "h3",
        weight: 400,
        alignment: "left",
      },
      {
        type: "subheading",
        alignment: "left",
      },
      {
        type: "paragraph",
        content: "Add more content here",
        as: "p",
        width: "full",
        alignment: "left",
      },
    ],
  },
});
