import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";

interface ContentInformationProps extends HydrogenComponentProps {
  heading: string;
  headingTagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  headingTextColor?: string;
  size?: HeadingProps["size"];
  mobileSize?: HeadingProps["mobileSize"];
  desktopSize?: HeadingProps["desktopSize"];
  weight?: HeadingProps["weight"];
  letterSpacing?: HeadingProps["letterSpacing"];
  alignment?: HeadingProps["alignment"];
  minSize?: HeadingProps["minSize"];
  maxSize?: HeadingProps["maxSize"];
  animate?: HeadingProps["animate"];
  description: string;
  descriptionColor?: string;
  descriptionSize: number;
  descriptionAlignment: "left" | "center" | "right";
  gap: number;
  ref?: React.Ref<HTMLDivElement>;
}

const ContentInformation = (props: ContentInformationProps) => {
  const {
    ref,
    children,
    gap,
    heading,
    headingTagName,
    headingTextColor,
    size,
    mobileSize,
    desktopSize,
    weight,
    letterSpacing,
    alignment,
    minSize,
    maxSize,
    animate,
    description,
    descriptionColor,
    descriptionSize,
    descriptionAlignment,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-col"
      style={{ gap: `${gap}px` }}
    >
      <div className="flex flex-col gap-2">
        <Heading
          content={heading}
          as={headingTagName}
          color={headingTextColor}
          size={size}
          mobileSize={mobileSize}
          desktopSize={desktopSize}
          weight={weight}
          letterSpacing={letterSpacing}
          alignment={alignment}
          minSize={minSize}
          maxSize={maxSize}
          animate={animate}
        />
        {description && (
          <p
            className="text-sm"
            style={{
              color: descriptionColor,
              fontSize: descriptionSize,
              textAlign: descriptionAlignment,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
};

export default ContentInformation;

export const schema = createSchema({
  type: "content-information",
  title: "Content Information",
  settings: [
    {
      group: "Header",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Customer Service",
          placeholder: "Customer Service",
        },
        ...headingInputs
          .filter((input) => input.name !== "color")
          .map((input) => {
            if (input.name === "as") {
              return { ...input, name: "headingTagName", defaultValue: "h3" };
            }
            if (input.name === "weight") {
              return { ...input, defaultValue: 400 };
            }
            return input;
          }),
        {
          type: "color",
          name: "headingTextColor",
          label: "Heading text color",
        },
        {
          type: "text",
          name: "description",
          label: "Description",
          defaultValue: "We offer support via email.",
          placeholder: "We offer support via email.",
        },
        {
          type: "color",
          name: "descriptionColor",
          label: "Description color",
        },
        {
          type: "range",
          name: "descriptionSize",
          label: "Description font size",
          defaultValue: 24,
          configs: {
            min: 12,
            max: 48,
            step: 2,
            unit: "px",
          },
        },
        {
          type: "select",
          name: "descriptionAlignment",
          label: "Description alignment",
          defaultValue: "left",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
        },
      ],
    },
    {
      group: "Content settings",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 40,
        },
      ],
    },
  ],
  childTypes: ["information--item"],
  presets: {
    heading: "Customer Service",
    headingTagName: "h3",
    weight: 400,
    alignment: "left",
    description: "We offer support via email.",
    descriptionSize: 24,
    descriptionAlignment: "left",
    gap: 40,
    children: [
      {
        type: "information--item",
        label: "Email",
        value: "support@archercommerce.com",
        labelColor: "#000000",
        valueColor: "#666666",
        fontSize: 14,
      },
      {
        type: "information--item",
        label: "Hours",
        value: "Monday - Friday, 9AM - 5PM ET",
        labelColor: "#000000",
        valueColor: "#666666",
        fontSize: 14,
      },
      {
        type: "information--item",
        label: "Average response time",
        value: "1 Business day",
        labelColor: "#000000",
        valueColor: "#666666",
        fontSize: 14,
      },
    ],
  },
});
