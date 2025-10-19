import * as Accordion from "@radix-ui/react-accordion";
import { Image } from "@shopify/hydrogen";
import type {
  HydrogenComponentProps,
  HydrogenComponentSchema,
} from "@weaverse/hydrogen";
import type React from "react";
import { forwardRef } from "react";
import { cn } from "~/utils/cn";

interface AccordionItemProps extends HydrogenComponentProps {
  title: string;
  content: string;
  icon: string;
  backgroundColor: string;
}

const isSvgString = (icon: string) =>
  icon.trim().startsWith("<svg") || icon.trim().startsWith("<?xml");

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  (props, ref) => {
    const { title, content, icon, backgroundColor, ...rest } = props;

    const renderIcon = () => {
      if (!icon) {
        return null;
      }

      if (isSvgString(icon)) {
        return (
          <span
            className="h-5 w-5"
            dangerouslySetInnerHTML={{ __html: icon }}
          />
        );
      }

      return (
        <Image
          src={icon}
          className="h-5 w-5"
          alt={title}
          width={20}
          height={20}
        />
      );
    };

    return (
      <Accordion.Item
        ref={ref}
        value={title}
        className={cn("w-full", "focus-within:relative focus-within:z-10")}
        {...rest}
      >
        <Accordion.Header>
          <Accordion.Trigger
            style={{ backgroundColor } as React.CSSProperties}
            className="group mb-1 flex w-full gap-3 p-4 text-left"
          >
            {renderIcon()}
            <span className="font-medium text-base">{title}</span>
            <div className="relative ml-auto h-5 w-5">
              <svg
                className="absolute inset-0 h-full w-full transition-opacity duration-200 group-data-[state=open]:opacity-0"
                width="24"
                height="25"
                viewBox="0 0 24 25"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 22.1367C13.9284 22.1367 15.8134 21.5649 17.4168 20.4935C19.0202 19.4222 20.2699 17.8995 21.0078 16.1179C21.7458 14.3363 21.9389 12.3759 21.5627 10.4846C21.1864 8.59327 20.2578 6.85599 18.8943 5.49243C17.5307 4.12887 15.7934 3.20027 13.9021 2.82406C12.0108 2.44786 10.0504 2.64094 8.26883 3.37889C6.48725 4.11685 4.96451 5.36653 3.89317 6.96991C2.82182 8.57329 2.25 10.4584 2.25 12.3867C2.25273 14.9717 3.28083 17.4501 5.10872 19.278C6.93661 21.1059 9.41497 22.134 12 22.1367ZM12 4.13672C13.6317 4.13672 15.2267 4.62057 16.5835 5.52709C17.9402 6.43362 18.9976 7.72209 19.622 9.22958C20.2464 10.7371 20.4098 12.3959 20.0915 13.9962C19.7731 15.5966 18.9874 17.0666 17.8336 18.2203C16.6798 19.3741 15.2098 20.1599 13.6095 20.4782C12.0091 20.7965 10.3503 20.6331 8.84286 20.0087C7.33537 19.3843 6.04689 18.3269 5.14037 16.9702C4.23385 15.6135 3.75 14.0184 3.75 12.3867C3.75248 10.1994 4.62247 8.10247 6.16911 6.55583C7.71574 5.00919 9.81272 4.1392 12 4.13672ZM7.5 12.3867C7.5 12.1878 7.57901 11.997 7.71967 11.8564C7.86032 11.7157 8.05108 11.6367 8.25 11.6367H11.25V8.63672C11.25 8.43781 11.329 8.24704 11.4697 8.10639C11.6103 7.96574 11.8011 7.88672 12 7.88672C12.1989 7.88672 12.3897 7.96574 12.5303 8.10639C12.671 8.24704 12.75 8.43781 12.75 8.63672V11.6367L15.75 11.6367C15.9489 11.6367 16.1397 11.7157 16.2803 11.8564C16.421 11.997 16.5 12.1878 16.5 12.3867C16.5 12.5856 16.421 12.7764 16.2803 12.917C16.1397 13.0577 15.9489 13.1367 15.75 13.1367L12.75 13.1367L12.75 16.1367C12.75 16.3356 12.671 16.5264 12.5303 16.667C12.3897 16.8077 12.1989 16.8867 12 16.8867C11.8011 16.8867 11.6103 16.8077 11.4697 16.667C11.329 16.5264 11.25 16.3356 11.25 16.1367L11.25 13.1367H8.25C8.05108 13.1367 7.86032 13.0577 7.71967 12.917C7.57901 12.7764 7.5 12.5856 7.5 12.3867Z"
                  fill="#918379"
                />
              </svg>
              <svg
                className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-200 group-data-[state=open]:opacity-100"
                width="24"
                height="25"
                viewBox="0 0 24 25"
                fill="none"
                aria-hidden
              >
                <path
                  d="M7.5 12.3867C7.5 12.1878 7.57901 11.997 7.71967 11.8564C7.86032 11.7157 8.05108 11.6367 8.25 11.6367L15.75 11.6367C15.9489 11.6367 16.1397 11.7157 16.2803 11.8564C16.421 11.997 16.5 12.1878 16.5 12.3867C16.5 12.5856 16.421 12.7764 16.2803 12.917C16.1397 13.0577 15.9489 13.1367 15.75 13.1367L8.25 13.1367C8.05108 13.1367 7.86032 13.0577 7.71967 12.917C7.57901 12.7764 7.5 12.5856 7.5 12.3867ZM2.25 12.3867C2.25 10.4584 2.82182 8.57329 3.89317 6.96991C4.96451 5.36653 6.48725 4.11685 8.26883 3.37889C10.0504 2.64094 12.0108 2.44786 13.9021 2.82406C15.7934 3.20027 17.5307 4.12887 18.8943 5.49243C20.2578 6.85599 21.1864 8.59327 21.5627 10.4846C21.9389 12.3759 21.7458 14.3363 21.0078 16.1179C20.2699 17.8995 19.0202 19.4222 17.4168 20.4935C15.8134 21.5649 13.9284 22.1367 12 22.1367C9.41497 22.134 6.93661 21.1059 5.10872 19.278C3.28083 17.4501 2.25273 14.9717 2.25 12.3867ZM3.75 12.3867C3.75 14.0184 4.23385 15.6135 5.14037 16.9702C6.04689 18.3269 7.33537 19.3843 8.84286 20.0087C10.3503 20.6331 12.0091 20.7965 13.6095 20.4782C15.2098 20.1599 16.6798 19.3741 17.8336 18.2203C18.9874 17.0666 19.7731 15.5966 20.0915 13.9962C20.4098 12.3959 20.2464 10.7371 19.622 9.22958C18.9976 7.72209 17.9402 6.43362 16.5835 5.52709C15.2267 4.62057 13.6317 4.13672 12 4.13672C9.81272 4.1392 7.71574 5.00919 6.16911 6.55583C4.62247 8.10247 3.75248 10.1994 3.75 12.3867Z"
                  fill="#918379"
                />
              </svg>
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
          <div className="p-4 text-body-subtle">{content}</div>
        </Accordion.Content>
      </Accordion.Item>
    );
  },
);

export default AccordionItem;

export const schema: HydrogenComponentSchema = {
  type: "accordion-item",
  title: "Accordion Item",
  settings: [
    {
      group: "Accordion Item",
      inputs: [
        {
          type: "text",
          name: "icon",
          label: "Icon (optional)",
          helpText:
            "In this input we support URLs (http, https, /images/, .png, .svg, .jpg, ...).",
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
      ],
    },
  ],
};
