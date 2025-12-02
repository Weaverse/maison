import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { useAnimation } from "~/hooks/use-animation";

interface ImageWithTextProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  enableImageHover?: boolean;
}

function ImageWithText(props: ImageWithTextProps) {
  const { children, ref, enableImageHover, ...rest } = props;
  const [scope] = useAnimation(ref);

  return (
    <Section
      ref={scope}
      {...rest}
      enableImageHover={enableImageHover}
      containerClassName="flex flex-col md:flex-row px-0 sm:px-0"
    >
      {children}
    </Section>
  );
}

export default ImageWithText;

export const schema = createSchema({
  type: "image-with-text",
  title: "Image with text",
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(({ name }) => name !== "gap"),
    },
    { group: "Background", inputs: backgroundInputs },
    {
      group: "Image",
      inputs: [
        {
          type: "switch",
          name: "enableImageHover",
          label: "Enable image hover effect",
          defaultValue: false,
        },
      ],
    },
  ],
  childTypes: ["image-with-text--content", "image-with-text--image"],
  presets: {
    verticalPadding: "none",
    backgroundColor: "#dbe3d6",
    backgroundFor: "content",
    children: [
      { type: "image-with-text--image", aspectRatio: "1/1" },
      { type: "image-with-text--content" },
    ],
  },
});
