import { createSchema } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { backgroundInputs } from "~/components/background-image";
import { Link } from "~/components/link";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { ArrowRight } from "~/components/view-all-button";

interface InstagramData {
  heading: string;
  handle: string;
  profileUrl: string;
  showViewMore: boolean;
  desktopColumns: number;
  itemsGap: number;
}

interface InstagramProps extends SectionProps, InstagramData {
  ref?: React.Ref<HTMLElement>;
}

export default function Instagram(props: InstagramProps) {
  const {
    ref,
    heading,
    handle,
    profileUrl,
    showViewMore,
    desktopColumns,
    itemsGap,
    children,
    ...rest
  } = props;

  return (
    <Section ref={ref} {...rest}>
      <div className="flex w-full flex-col gap-16">
        {(heading || handle) && (
          <div className="flex w-full flex-col items-start justify-center gap-4 md:flex-row md:items-center">
            {heading ? (
              <h3 className="whitespace-nowrap font-serif text-[44px] text-body leading-[1.1] tracking-[-1.32px] md:flex-1">
                {heading}
              </h3>
            ) : null}
            {handle ? (
              <Link
                className="flex shrink-0 items-center gap-2.5 p-1 text-body"
                target="_blank"
                to={profileUrl || "#"}
              >
                <span className="whitespace-nowrap text-base leading-none tracking-[0.28px] underline">
                  {handle}
                </span>
                <ArrowRight />
              </Link>
            ) : null}
          </div>
        )}

        <div
          className="grid w-full grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-3 md:gap-(--ig-gap) lg:[grid-template-columns:repeat(var(--ig-cols),minmax(0,1fr))]"
          style={
            {
              "--ig-gap": `${itemsGap}px`,
              "--ig-cols": desktopColumns,
            } as CSSProperties
          }
        >
          {children}

          {showViewMore ? (
            <Link
              className="flex aspect-square w-full items-center justify-center rounded-[16px] bg-background p-4 text-center"
              target="_blank"
              to={profileUrl || "#"}
            >
              <span className="font-serif text-[24px] text-body-subtle leading-normal">
                View more in
                <br />
                <span className="text-body">{handle}</span>
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

export const schema = createSchema({
  type: "instagram",
  title: "Instagram",
  childTypes: ["instagram--item"],
  settings: [
    {
      group: "Layout",
      inputs: [
        ...layoutInputs.filter((inp) => inp.name !== "borderRadius"),
        {
          type: "range",
          name: "desktopColumns",
          label: "Columns (desktop)",
          configs: { min: 3, max: 6, step: 1 },
          defaultValue: 5,
        },
        {
          type: "range",
          name: "itemsGap",
          label: "Items gap",
          configs: { min: 8, max: 40, step: 4, unit: "px" },
          defaultValue: 24,
        },
      ],
    },
    {
      group: "Background",
      inputs: backgroundInputs.filter((inp) => inp.name === "backgroundColor"),
    },
    {
      group: "Account",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Instagram",
        },
        {
          type: "text",
          name: "handle",
          label: "Handle",
          defaultValue: "@maison_ig",
        },
        {
          type: "text",
          name: "profileUrl",
          label: "Profile link",
          defaultValue: "https://www.instagram.com/",
        },
        {
          type: "switch",
          name: "showViewMore",
          label: "Show 'View more' tile",
          defaultValue: true,
        },
      ],
    },
  ],
  presets: {
    backgroundColor: "#F9F7F4",
    heading: "Instagram",
    handle: "@maison_ig",
    profileUrl: "https://www.instagram.com/",
    showViewMore: true,
    desktopColumns: 5,
    itemsGap: 24,
    children: [
      { type: "instagram--item" },
      { type: "instagram--item" },
      { type: "instagram--item" },
      { type: "instagram--item" },
    ],
  },
});
