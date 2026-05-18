import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "~/utils/cn";

const variants = cva("", {
  variants: {
    gap: {
      0: "",
      4: "space-y-1",
      8: "space-y-2",
      12: "space-y-3",
      16: "space-y-4",
      20: "space-y-5",
      24: "space-y-6",
      28: "space-y-7",
      32: "space-y-8",
    },
  },
  defaultVariants: {
    gap: 0,
  },
});

interface TestimonialsHeaderProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function TestimonialsHeader(props: TestimonialsHeaderProps) {
  const { ref, gap, children, className, ...rest } = props;

  return (
    <div ref={ref} {...rest} className={cn(variants({ gap }), className)}>
      {children}
    </div>
  );
}

export default TestimonialsHeader;

export const schema = createSchema({
  type: "testimonials--header",
  title: "Header",
  childTypes: ["heading", "subheading", "paragraph"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Content spacing",
          configs: {
            min: 0,
            max: 32,
            step: 4,
            unit: "px",
          },
          defaultValue: 16,
        },
      ],
    },
  ],
});
