import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface HeaderContainerProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

const HeaderContainer = (props: HeaderContainerProps) => {
  const { ref, children, gap, ...rest } = props;

  // `mb-10` holds 40px below the heading at every width. It used to drop to
  // zero from `md` up, which left the section's own `space-y` as the only gap
  // and put the heading almost on top of the first card.
  return (
    <div
      ref={ref}
      {...rest}
      className="mb-10 flex flex-row items-center justify-between"
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
