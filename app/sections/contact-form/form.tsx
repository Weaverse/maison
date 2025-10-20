import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";

const variants = cva("flex flex-col items-center max-w-[640px] w-full", {
  variants: {
    gap: {
      0: "gap-0",
      4: "gap-1",
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
      36: "gap-9",
      40: "gap-10",
      44: "gap-11",
      48: "gap-12",
      52: "gap-[52px]",
      56: "gap-14",
      60: "gap-[60px]",
    },
  },
  defaultVariants: {
    gap: 16,
  },
});

const inputVariants = cva(
  "px-3 py-3.5 w-full focus:outline-none focus:ring-0",
  {
    variants: {
      borderRadius: {
        0: "rounded-none",
        2: "rounded-xs",
        4: "rounded-sm",
        6: "rounded-md",
        8: "rounded-lg",
        10: "rounded-[10px]",
        12: "rounded-xl",
        14: "rounded-[14px]",
        16: "rounded-2xl",
        18: "rounded-[18px]",
        20: "rounded-[20px]",
      },
    },
    defaultVariants: {
      borderRadius: 4,
    },
  },
);

const rowVariants = cva("flex flex-col sm:flex-row w-full", {
  variants: {
    gap: {
      0: "gap-0",
      4: "gap-1",
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
      36: "gap-9",
      40: "gap-10",
      44: "gap-11",
      48: "gap-12",
      52: "gap-[52px]",
      56: "gap-14",
      60: "gap-[60px]",
    },
  },
  defaultVariants: {
    gap: 16,
  },
});

interface ContactFormProps
  extends VariantProps<typeof variants>,
    VariantProps<typeof inputVariants>,
    HydrogenComponentProps {
  inputBorderColor?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  placeholderColor?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const ContactForm = forwardRef<HTMLDivElement, ContactFormProps>(
  (props, ref) => {
    const {
      children,
      gap,
      inputBorderColor,
      inputBackgroundColor,
      inputTextColor,
      placeholderColor,
      borderRadius,
    } = props;

    return (
      <div
        ref={ref}
        className={variants({ gap })}
        style={
          {
            "--placeholder-color": placeholderColor,
          } as React.CSSProperties
        }
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
            input::placeholder,
            textarea::placeholder {
              color: var(--placeholder-color) !important;
            }
          `,
          }}
        />
        <div className={rowVariants({ gap })}>
          <input
            type="text"
            placeholder="Your name *"
            className={inputVariants({ borderRadius })}
            style={{
              border: `1px solid ${inputBorderColor}`,
              backgroundColor: inputBackgroundColor,
              color: inputTextColor,
            }}
          />
          <input
            type="text"
            placeholder="Company name"
            className={inputVariants({ borderRadius })}
            style={{
              border: `1px solid ${inputBorderColor}`,
              backgroundColor: inputBackgroundColor,
              color: inputTextColor,
            }}
          />
        </div>

        <div className={rowVariants({ gap })}>
          <input
            type="email"
            placeholder="Contact email*"
            className={inputVariants({ borderRadius })}
            style={{
              border: `1px solid ${inputBorderColor}`,
              backgroundColor: inputBackgroundColor,
              color: inputTextColor,
            }}
          />
          <input
            type="url"
            placeholder="Website"
            className={inputVariants({ borderRadius })}
            style={{
              border: `1px solid ${inputBorderColor}`,
              backgroundColor: inputBackgroundColor,
              color: inputTextColor,
            }}
          />
        </div>

        <textarea
          name=""
          id=""
          placeholder="Message"
          className={`${inputVariants({ borderRadius })} h-[116px] resize-none`}
          style={
            {
              border: `1px solid ${inputBorderColor}`,
              backgroundColor: inputBackgroundColor,
              color: inputTextColor,
              "--placeholder-color": placeholderColor,
            } as React.CSSProperties
          }
        />
      </div>
    );
  },
);

export default ContactForm;

export const schema = createSchema({
  type: "contact-form-fields",
  title: "Contact form fields",
  childTypes: [],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Gap",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
    {
      group: "Input Styling",
      inputs: [
        {
          type: "color",
          name: "inputBorderColor",
          label: "Border color",
          defaultValue: "#DCDCDC",
        },
        {
          type: "color",
          name: "inputBackgroundColor",
          label: "Background color",
        },
        {
          type: "color",
          name: "inputTextColor",
          label: "Text color",
        },
        {
          type: "color",
          name: "placeholderColor",
          label: "Placeholder color",
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          defaultValue: 4,
          configs: {
            min: 0,
            max: 20,
            step: 2,
            unit: "px",
          },
        },
      ],
    },
  ],
});
