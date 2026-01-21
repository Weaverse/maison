import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";

interface CompanyStoryContactData {
  address?: string;
  contentBackgroundColor?: string;
  gap?: number;
}

interface CompanyStoryContactProps
  extends HydrogenComponentProps,
    CompanyStoryContactData {
  ref?: React.Ref<HTMLDivElement>;
}

const CompanyStoryContact = (props: CompanyStoryContactProps) => {
  const { ref, address, contentBackgroundColor, gap, children, ...rest } =
    props;

  return (
    <div
      ref={ref}
      {...rest}
      className="rounded-b px-5 py-8 md:px-20"
      style={{
        backgroundColor: contentBackgroundColor,
      }}
    >
      <div className="flex flex-col gap-5 items-center md:flex-row">
        <div className="w-full md:w-2/3">
          <div
            className="flex flex-col items-center"
            style={{ gap: `${gap}px` }}
          >
            {children}
          </div>
        </div>

        {/* map */}
        <div className="overflow-hidden rounded-sm w-full md:w-1/3 ">
          <iframe
            className="size-full"
            title="Google map embedded frame"
            src={`https://maps.google.com/maps?t=m&q=${encodeURIComponent(address)}&ie=UTF8&&output=embed`}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyStoryContact;

export const schema = createSchema({
  type: "company-story--contact",
  title: "Contact",
  childTypes: ["paragraph"],
  settings: [
    {
      group: "Style",
      inputs: [
        {
          type: "color",
          name: "contentBackgroundColor",
          label: "Content background color",
          defaultValue: "#FFFFFF",
        },
        {
          type: "range",
          name: "gap",
          label: "Content gap",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 20,
        },
      ],
    },
    {
      group: "Map",
      inputs: [
        {
          type: "text",
          name: "address",
          label: "Address",
          defaultValue: "845 Market Street, San Francisco, CA 94103 US",
          helpText: "Address for Google Maps display",
        },
      ],
    },
  ],
  presets: {
    children: [
      {
        type: "paragraph",
        content: "Add more content here",
        width: "full",
        alignment: "left",
      },
      {
        type: "paragraph",
        content: "Add more content here",
        width: "full",
        alignment: "left",
      },
    ],
  },
});
