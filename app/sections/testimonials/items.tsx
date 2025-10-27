import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";

interface TestimonialsItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

function TestimonialsItems(props: TestimonialsItemsProps) {
  const { gap, children, ref, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="grid lg:grid-cols-3"
      style={{ gap: `${gap}px` }}
    >
      <div className="space-y-6">{children?.filter((_, i) => i % 3 === 0)}</div>
      <div className="space-y-6">{children?.filter((_, i) => i % 3 === 1)}</div>
      <div className="space-y-6">{children?.filter((_, i) => i % 3 === 2)}</div>
    </div>
  );
}

export default TestimonialsItems;

export const schema = createSchema({
  type: "testimonials-items",
  title: "Items",
  childTypes: ["testimonial--item"],
  settings: [
    {
      group: "Items",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 16,
            max: 40,
            step: 8,
            unit: "px",
          },
          defaultValue: 32,
        },
      ],
    },
  ],
});
