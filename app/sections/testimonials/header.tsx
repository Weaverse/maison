import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type React from "react";

interface TestimonialsHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

const TestimonialsHeader = ({ ref, children, gap, ...props }: TestimonialsHeaderProps) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ gap: `${gap}px` }}
      className="flex flex-col"
    >
      {children}
    </div>
  );
};

export default TestimonialsHeader;

export const schema = createSchema({
  type: "testimonials--header",
  title: "Testimonials header",
  childTypes: ["heading", "subheading", "paragraph"],
  settings: [
    {
      group: "Header layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Header spacing",
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
