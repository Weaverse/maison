import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface HeaderContainerProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

const HeaderContainer = (props: HeaderContainerProps) => {
  const { ref, children, gap, ...rest } = props;

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
  type: "related-products--header",
  title: "Related products header",
  childTypes: ["heading", "view-all-button"],
  settings: [
    {
      group: "Header layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Item spacing (mobile)",
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
  ],
});

