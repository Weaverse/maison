import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface HeaderContainerProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

const HeaderContainer = (props: HeaderContainerProps) => {
  const { ref, children, gap = 16, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
};

export default HeaderContainer;

export const schema = createSchema({
  type: "multicolumn--header",
  title: "Multicolumn header",
  childTypes: ["heading", "view-all-button"],
  settings: [
    {
      group: "Header Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Item spacing (mobile)",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 32,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
  ],
});
