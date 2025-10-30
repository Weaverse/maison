import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";

interface CompanyStorySeparatorData {
  hideSeparator?: boolean;
  separatorThickness?: number;
  separatorColor?: string;
}

interface CompanyStorySeparatorProps
  extends HydrogenComponentProps,
    CompanyStorySeparatorData {
  ref?: React.Ref<HTMLDivElement>;
}

const CompanyStorySeparator = (props: CompanyStorySeparatorProps) => {
  const { ref, hideSeparator, separatorThickness, separatorColor, ...rest } =
    props;

  if (hideSeparator) {
    return null;
  }

  return (
    <div
      ref={ref}
      {...rest}
      className="w-full"
      style={{
        height: `${separatorThickness}px`,
        backgroundColor: separatorColor,
      }}
    />
  );
};

export default CompanyStorySeparator;

export const schema = createSchema({
  type: "company-story--separator",
  title: "Separator",
  settings: [
    {
      group: "Separator",
      inputs: [
        {
          type: "switch",
          name: "hideSeparator",
          label: "Hide separator",
          defaultValue: false,
        },
        {
          type: "range",
          name: "separatorThickness",
          label: "Separator thickness",
          configs: {
            min: 2,
            max: 10,
            step: 1,
            unit: "px",
          },
          defaultValue: 2,
          condition: (data: CompanyStorySeparatorData) =>
            data.hideSeparator === false,
        },
        {
          type: "color",
          name: "separatorColor",
          label: "Separator color",
          defaultValue: "#DCDCDC",
          condition: (data: CompanyStorySeparatorData) =>
            data.hideSeparator === false,
        },
      ],
    },
  ],
});
