import { createSchema } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface ImageWithProductData {
  heading: string;
  headingColor?: string;
  headingBackgroundColor?: string;
}

interface ImageWithProductProps extends SectionProps, ImageWithProductData {
  ref?: React.Ref<HTMLElement>;
}

export default function ImageWithProduct(props: ImageWithProductProps) {
  const {
    ref,
    heading,
    headingColor,
    headingBackgroundColor,
    children,
    ...rest
  } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      className="px-5 md:px-10 lg:px-10"
      overflow="unset"
    >
      <div className="relative">
        {heading ? (
          <h2
            className="mb-6 w-fit max-w-[min(100%,620px)] rounded-br-[20px] rounded-tr-[48px] px-8 py-4 font-normal text-[26px] leading-none md:px-18 md:py-8 md:text-[32px]"
            style={
              {
                color: headingColor,
                backgroundColor: headingBackgroundColor,
              } as CSSProperties
            }
          >
            {heading}
          </h2>
        ) : null}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>
      </div>
    </Section>
  );
}

export const schema = createSchema({
  type: "image-with-product",
  title: "Image with product",
  childTypes: ["image-with-product--card"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(
        (input) => input.name !== "borderRadius" && input.name !== "gap",
      ),
    },
  ],
  presets: {
    width: "stretch",
    verticalPadding: "none",
    children: [
      { type: "image-with-product--card" },
      { type: "image-with-product--card" },
    ],
  },
});
