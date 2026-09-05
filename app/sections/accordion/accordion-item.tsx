import * as Accordion from "@radix-ui/react-accordion";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import type React from "react";
import { Image } from "~/components/image";
import { cn } from "~/utils/cn";

interface AccordionItemProps extends HydrogenComponentProps {
  title: string;
  content: string;
  icon: string;
  backgroundColor: string;
  ref?: React.Ref<HTMLDivElement>;
}

const isSvgString = (icon: string) =>
  icon.trim().startsWith("<svg") || icon.trim().startsWith("<?xml");

const AccordionItem = (props: AccordionItemProps) => {
  const { ref, title, content, icon, backgroundColor, ...rest } = props;

  const renderIcon = () => {
    if (!icon) {
      return null;
    }

    if (isSvgString(icon)) {
      return (
        <span className="h-6 w-6" dangerouslySetInnerHTML={{ __html: icon }} />
      );
    }

    return (
      <Image
        src={icon}
        className="h-6 w-6"
        alt={title}
        width={24}
        height={24}
      />
    );
  };

  return (
    <Accordion.Item
      ref={ref}
      {...rest}
      value={title}
      className="w-full focus-within:relative focus-within:z-10 group"
      data-motion="fade-up"
    >
      <Accordion.Header>
        <Accordion.Trigger
          style={{ backgroundColor }}
          className="group flex w-full items-center gap-3 rounded-xl p-4 text-left group-data-[state=open]:mb-0.5 group-data-[state=open]:rounded-b-none"
        >
          {renderIcon()}
          <span className="text-[16px] leading-[1.4] tracking-[0.02em]">
            {title}
          </span>
          <div className="relative ml-auto flex size-6 items-center justify-center rounded-full border-[2.5px] border-line">
            <span className="absolute h-[2px] w-3 bg-line" />
            <span className="absolute h-[2px] w-3 rotate-90 bg-line transition-transform duration-200 group-data-[state=open]:rotate-0" />
          </div>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content
        style={
          {
            "--expand-to": "var(--radix-accordion-content-height)",
            "--expand-duration": "0.25s",
            "--collapse-from": "var(--radix-accordion-content-height)",
            "--collapse-duration": "0.25s",
            backgroundColor,
          } as React.CSSProperties
        }
        className={cn(
          "overflow-hidden rounded-b-xl",
          "data-[state=closed]:animate-collapse",
          "data-[state=open]:animate-expand",
        )}
      >
        <div className="p-4 text-base text-body-subtle leading-[1.6]">
          {content}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
};

export default AccordionItem;

export const schema: HydrogenComponentSchema = {
  type: "accordion--item",
  title: "Accordion item",
  settings: [
    {
      group: "Item",
      inputs: [
        {
          type: "text",
          name: "icon",
          label: "Icon (optional)",
          helpText:
            "Supports URLs (http, https, /images/, .png, .svg, .jpg, ...) or SVG code.",
        },
        {
          type: "text",
          name: "title",
          label: "Title",
          defaultValue: "Accordion item title",
          placeholder: "Enter item title",
        },
        {
          type: "textarea",
          name: "content",
          label: "Content",
          defaultValue: "Accordion item content goes here.",
          placeholder: "Enter item content",
        },
        {
          type: "color",
          name: "backgroundColor",
          label: "Background Color",
          defaultValue: "#EFEEEA",
        },
      ],
    },
  ],
};
