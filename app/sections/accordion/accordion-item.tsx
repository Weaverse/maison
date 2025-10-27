import * as Accordion from "@radix-ui/react-accordion";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import type React from "react";
import { cn } from "~/utils/cn";
import {
  PlusCircleIcon,
  MinusCircleIcon,
  TruckIcon,
  PaintBrushHouseholdIcon,
  RulerIcon,
  PackageIcon,
} from "@phosphor-icons/react";

interface AccordionItemProps extends HydrogenComponentProps {
  title: string;
  content: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  ref?: React.Ref<HTMLDivElement>;
}

const AccordionItem = (props: AccordionItemProps) => {
  const { ref, title, content, icon, backgroundColor, textColor, ...rest } =
    props;

  const renderIcon = () => {
    if (!icon) {
      return null;
    }

    // Icon mapping
    const iconMap = {
      truck: TruckIcon,
      "paint-brush-household": PaintBrushHouseholdIcon, // Custom string name
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
      className={cn("w-full", "focus-within:relative focus-within:z-10")}
    >
      <Accordion.Header>
        <Accordion.Trigger
          style={{ backgroundColor, color: textColor } as React.CSSProperties}
          className="group mb-1 flex w-full gap-3 p-4 text-left"
        >
          {renderIcon()}
          <span className="font-medium text-base">{title}</span>
          <div className="relative ml-auto h-5 w-5">
            <PlusCircleIcon className="absolute inset-0 h-full w-full transition-opacity duration-200 group-data-[state=open]:opacity-0" />
            <MinusCircleIcon className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-200 group-data-[state=open]:opacity-100" />
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
          "overflow-hidden",
          "data-[state=closed]:animate-collapse",
          "data-[state=open]:animate-expand",
        )}
      >
        <div className="p-4" style={{ color: textColor }}>
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
          defaultValue: "Accordion Item Title",
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
        {
          type: "color",
          name: "textColor",
          label: "Text Color",
          defaultValue: "#000000",
        },
      ],
    },
  ],
};
