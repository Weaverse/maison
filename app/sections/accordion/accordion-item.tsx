import {
  PackageIcon,
  PaintBrushHouseholdIcon,
  RulerIcon,
  TruckIcon,
} from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import type React from "react";
import { cn } from "~/utils/cn";

interface AccordionItemProps extends HydrogenComponentProps {
  title: string;
  content: string;
  icon: string;
  backgroundColor: string;
  ref?: React.Ref<HTMLDivElement>;
}

const AccordionItem = (props: AccordionItemProps) => {
  const { ref, title, content, icon, backgroundColor, ...rest } = props;

  const renderIcon = () => {
    if (!icon) {
      return null;
    }

    const iconMap = {
      truck: TruckIcon,
      "paint-brush-household": PaintBrushHouseholdIcon,
      ruler: RulerIcon,
      package: PackageIcon,
    };

    const IconComponent = iconMap[icon as keyof typeof iconMap];

    if (!IconComponent) {
      return null;
    }

    return <IconComponent className="h-5 w-5" />;
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
          className="group mb-1 flex w-full gap-3 p-4 text-left rounded group-data-[state=open]:rounded-b-none"
        >
          {renderIcon()}
          <span className="text-base">{title}</span>
          <div className="relative ml-auto size-5 flex items-center justify-center rounded-full border-[2.5px] border-line">
            <span className="absolute h-[2px] w-2.5 bg-line" />
            <span className="absolute h-[2px] w-2.5 bg-line rotate-90 group-data-[state=open]:rotate-0 transition-transform duration-200" />
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
          "overflow-hidden rounded-b",
          "data-[state=closed]:animate-collapse",
          "data-[state=open]:animate-expand",
        )}
      >
        <div className="p-4 text-sm">{content}</div>
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
          type: "toggle-group",
          name: "icon",
          label: "Icon (optional)",
          configs: {
            options: [
              { value: "truck", label: "Truck" },
              { value: "paint-brush-household", label: "Brush" },
              { value: "ruler", label: "Ruler" },
              { value: "package", label: "Package" },
            ],
          },
          defaultValue: "truck",
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
          defaultValue: "#efefef",
        },
      ],
    },
  ],
};
