import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";

interface CompanyStorySeparatorData {
  enableSeparator?: boolean;
  separatorThickness?: number;
  separatorColor?: string;
}

interface CompanyStorySeparatorProps
  extends HydrogenComponentProps,
    CompanyStorySeparatorData {
  ref?: React.Ref<HTMLDivElement>;
}

const CompanyStorySeparator = (props: CompanyStorySeparatorProps) => {
  const { ref, enableSeparator, separatorThickness, separatorColor, ...rest } =
    props;

  if (!enableSeparator) {
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
          name: "enableSeparator",
          label: "Enable separator",
          defaultValue: true,
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
            data.enableSeparator === true,
        },
        {
          type: "color",
          name: "separatorColor",
          label: "Separator color",
          defaultValue: "#DCDCDC",
          condition: (data: CompanyStorySeparatorData) =>
            data.enableSeparator === true,
        },
      ],
    },
  ],
});
