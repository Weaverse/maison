import { createSchema } from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import Link, {
  type LinkProps,
  type LinkStyles,
  linkStylesInputs,
} from "~/components/link";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";

const variants = cva("w-full", {
  variants: {
    height: {
      small: "h-[40vh]",
      medium: "h-[50vh]",
      large: "h-[60vh]",
    },
  },
  defaultVariants: {
    height: "small",
  },
});

interface MapSectionProps
  extends Omit<SectionProps, "backgroundColor">,
    VariantProps<typeof variants>,
    LinkStyles {
  ref: React.Ref<HTMLElement>;
  address: string;
  heading: string;
  infoBgColor: string;
  addressLabel: string;
  addressContent: string;
  hoursLabel: string;
  description: string;
  contactLabel: string;
  contactContent: string;
  variant: LinkProps["variant"];
  buttonText: LinkProps["children"];
  boxBgColor: string;
  boxTextColor: string;
  boxBorderRadius: number;
}

export default function MapSection(props: MapSectionProps) {
  const {
    ref,
    height,
    heading,
    address,
    infoBgColor,
    addressLabel,
    addressContent,
    hoursLabel,
    description,
    contactLabel,
    contactContent,
    boxBgColor,
    boxTextColor,
    boxBorderRadius,
    buttonText,
    variant,
    backgroundColor,
    textColor,
    borderColor,
    backgroundColorHover,
    textColorHover,
    borderColorHover,
    ...rest
  } = props;

  const customButtonStyles = {
    backgroundColor,
    textColor,
    borderColor,
    backgroundColorHover,
    textColorHover,
    borderColorHover,
  };

  const cardStyle = {
    backgroundColor: boxBgColor,
    color: boxTextColor,
    borderRadius: `${boxBorderRadius}px`,
  };

  return (
    <Section ref={ref} {...rest} containerClassName="p-0" overflow="unset">
      {/* Store info card — sits above the map. Figma casts a 25% shadow here;
          softened to 10% so the map's top edge does not read as dirty. */}
      <div
        className="relative z-10 w-full px-6 py-12 shadow-[0_20px_20px_rgb(0_0_0_/_10%)] md:px-12 md:py-20"
        style={{ backgroundColor: infoBgColor }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 md:gap-12 md:px-10">
          {heading ? (
            <h3 className="text-center font-serif text-[44px] text-body leading-[1.1] tracking-[-1.32px]">
              {heading}
            </h3>
          ) : null}

          <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
            {/* Address */}
            <div
              className="flex flex-1 flex-col items-center gap-6 border-line-subtle border-l px-6 py-9"
              style={cardStyle}
            >
              <div className="flex w-full flex-col items-center gap-2 text-center tracking-[0.28px]">
                <p className="font-semibold text-base text-body leading-[1.6] opacity-50">
                  {addressLabel}
                </p>
                {addressContent ? (
                  <div
                    className="w-full space-y-1 text-base leading-[1.6]"
                    dangerouslySetInnerHTML={{ __html: addressContent }}
                  />
                ) : null}
              </div>
              {buttonText ? (
                <Link
                  to={`https://www.google.com/maps/search/${address}`}
                  variant={variant}
                  {...(variant === "custom" ? customButtonStyles : {})}
                  target="_blank"
                >
                  {buttonText}
                </Link>
              ) : null}
            </div>

            {/* Opening hours and contact */}
            <div
              className="flex flex-1 flex-col justify-center gap-6 px-6 py-9 tracking-[0.28px]"
              style={cardStyle}
            >
              <div className="flex w-full flex-col items-center gap-2 text-center">
                <p className="font-semibold text-base text-body leading-[1.6] opacity-50">
                  {hoursLabel}
                </p>
                {description ? (
                  <div
                    className="w-full space-y-1 text-base leading-[1.6]"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                ) : null}
              </div>
              <div className="flex w-full flex-col items-center gap-2 text-center">
                <p className="font-semibold text-base text-body leading-[1.6] opacity-50">
                  {contactLabel}
                </p>
                {contactContent ? (
                  <div
                    className="w-full space-y-1 text-base leading-[1.6]"
                    dangerouslySetInnerHTML={{ __html: contactContent }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <iframe
        className={variants({ height })}
        title="Google map embedded frame"
        src={`https://maps.google.com/maps?t=m&q=${address}&ie=UTF8&&output=embed`}
      />
    </Section>
  );
}

export const schema = createSchema({
  type: "map",
  title: "Map",
  settings: [
    {
      group: "Map",
      inputs: [
        {
          type: "text",
          name: "address",
          label: "Map address",
          defaultValue: "301 Front St W, Toronto, ON M5V 2T6, Canada",
          helpText:
            "Used for the map pin and the Get Directions link, not shown as text.",
        },
        {
          type: "select",
          name: "height",
          label: "Map height",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ],
          },
          defaultValue: "small",
        },
      ],
    },
    {
      group: "Store info",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Where to find us",
        },
        {
          type: "color",
          name: "infoBgColor",
          label: "Band background",
          defaultValue: "#F2F0EE",
        },
        {
          type: "text",
          name: "addressLabel",
          label: "Address label",
          defaultValue: "ADDRESS",
        },
        {
          type: "richtext",
          name: "addressContent",
          label: "Addresses",
          defaultValue:
            "<p><strong>Store 1</strong>: 9153 Jerry Dr, Juneau, Alaska 99801, USA</p><p><strong>Store 2</strong>: 4821 Maple Ridge Blvd, Boulder, Colorado 80302, USA</p>",
        },
        {
          type: "text",
          name: "hoursLabel",
          label: "Opening hours label",
          defaultValue: "OPENING HOURS",
        },
        {
          type: "richtext",
          name: "description",
          label: "Opening hours",
          defaultValue:
            "<p>Mon - Fri: 08:00 - 22:00</p><p>Sat - Sun: 08:00 - 20:00</p>",
        },
        {
          type: "text",
          name: "contactLabel",
          label: "Contact label",
          defaultValue: "CONTACT",
        },
        {
          type: "richtext",
          name: "contactContent",
          label: "Contact",
          defaultValue: "<p>+1 (907) 555-0123</p><p>visit@maison.com</p>",
        },
        {
          type: "color",
          name: "boxBgColor",
          label: "Card background",
          defaultValue: "#EBEAE5",
        },
        {
          type: "color",
          name: "boxTextColor",
          label: "Card text color",
        },
        {
          type: "range",
          name: "boxBorderRadius",
          label: "Card border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 16,
        },
      ],
    },
    {
      group: "Direction button",
      inputs: [
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Get Directions",
          placeholder: "Get Directions",
        },
        {
          type: "select",
          name: "variant",
          label: "Variant",
          configs: {
            options: [
              { label: "Primary", value: "primary" },
              { label: "Secondary", value: "secondary" },
              { label: "Outline", value: "outline" },
              { label: "Link", value: "link" },
              { label: "Custom styles", value: "custom" },
            ],
          },
          defaultValue: "primary",
        },
        ...linkStylesInputs,
      ],
    },
  ],
});
