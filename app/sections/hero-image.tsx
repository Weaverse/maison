import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  useThemeSettings,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { useAnimation } from "~/hooks/use-animation";

export interface HeroImageProps extends VariantProps<typeof variants> {
  ref: React.Ref<HTMLElement>;
  heightForMobile?: number;
  heightForDesktop?: number;
}

const variants = cva(
  "flex flex-col [&_.paragraph]:mx-[unset] [&_.heading]:max-w-[720px]",
  {
    variants: {
      height: {
        small: "min-h-[40vh] lg:min-h-[50vh]",
        medium: "min-h-[50vh] lg:min-h-[60vh]",
        large: "min-h-[70vh] lg:min-h-[80vh]",
        full: "",
        custom: "",
      },
      enableTransparentHeader: {
        true: "",
        false: "",
      },
      contentPosition: {
        "top left": "items-start justify-start [&_.paragraph]:text-left",
        "top center": "items-center justify-start [&_.paragraph]:text-center",
        "top right": "items-end justify-start [&_.paragraph]:text-right",
        "center left": "items-start justify-center [&_.paragraph]:text-left",
        "center center":
          "items-center justify-center [&_.paragraph]:text-center",
        "center right": "items-end justify-center [&_.paragraph]:text-right",
        "bottom left": "items-start justify-end [&_.paragraph]:text-left",
        "bottom center": "items-center justify-end [&_.paragraph]:text-center",
        "bottom right": "items-end justify-end [&_.paragraph]:text-right",
      },
    },
    compoundVariants: [
      {
        height: "full",
        enableTransparentHeader: true,
        className: "h-screen-no-topbar",
      },
      {
        height: "full",
        enableTransparentHeader: false,
        className: "h-screen-dynamic",
      },
    ],
    defaultVariants: {
      height: "large",
      contentPosition: "center center",
    },
  },
);

export default function HeroImage(props: HeroImageProps & SectionProps) {
  const {
    ref,
    children,
    height,
    contentPosition,
    heightForMobile,
    heightForDesktop,
    ...rest
  } = props;
  const { enableTransparentHeader } = useThemeSettings();
  const [scope] = useAnimation(ref);

  return (
    <Section
      ref={scope}
      {...rest}
      containerClassName={clsx(
        variants({ contentPosition, height, enableTransparentHeader }),
        height === "custom" &&
          "min-h-[var(--custom-height-mobile)] lg:min-h-[var(--custom-height-desktop)]",
      )}
      style={
        height === "custom"
          ? ({
              "--custom-height-mobile": `${heightForMobile}px`,
              "--custom-height-desktop": `${heightForDesktop}px`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </Section>
  );
}

export const schema = createSchema({
  type: "hero-image",
  title: "Hero image",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "height",
          label: "Section height",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "full", label: "Fullscreen" },
              { value: "custom", label: "Custom" },
            ],
          },
        },
        {
          type: "range",
          name: "heightForMobile",
          label: "Height for mobile (px)",
          configs: {
            min: 100,
            max: 1000,
            step: 10,
            unit: "px",
          },
          defaultValue: 500,
          condition: (section) => section.height === "custom",
        },
        {
          type: "range",
          name: "heightForDesktop",
          label: "Height for desktop (px)",
          configs: {
            min: 100,
            max: 1200,
            step: 10,
            unit: "px",
          },
          defaultValue: 700,
          condition: (section) => section.height === "custom",
        },
        {
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center center",
        },
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
      ],
    },
    { group: "Background", inputs: backgroundInputs },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    height: "custom",
    heightForMobile: 500,
    heightForDesktop: 640,
    contentPosition: "center center",
    width: "custom",
    customWidth: 720,
    gap: 32,
    verticalPadding: "none",
    backgroundImage: IMAGES_PLACEHOLDERS.banner_1,
    backgroundFit: "cover",
    enableOverlay: true,
    overlayType: "gradient",
    gradientDirection: "to bottom",
    gradientFrom: "#301F12",
    gradientFromOpacity: 0,
    gradientTo: "#A2927A",
    gradientToOpacity: 80,
    children: [
      {
        type: "subheading",
        content: "Welcome industry insiders",
        color: "#FEF6EB",
        alignment: "center",
      },
      {
        type: "heading",
        content: "Pillows that feel like clouds",
        as: "h3",
        color: "#FEF6EB",
        size: "default",
        alignment: "center",
      },
      {
        type: "paragraph",
        content:
          "Wide inventory of furniture with plenty of essentials that no home would be complete without.",
        color: "#FEF6EB",
        alignment: "center",
      },
      {
        type: "button",
        text: "Shop Now",
        variant: "secondary",
      },
    ],
  },
});
