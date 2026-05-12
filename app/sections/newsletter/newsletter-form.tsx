import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { CustomerApiPlayLoad } from "~/routes/($locale).api.customer";

const inputVariants = cva("border max-w-full", {
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
    borderRadius: 8,
  },
});

interface NewsLetterInputProps
  extends VariantProps<typeof inputVariants>,
    HydrogenComponentProps {
  width: number;
  placeholder: string;
  buttonText: string;
  helpText: string;
  successText?: string;
  inputBackgroundColor?: string;
  ref?: React.Ref<HTMLDivElement>;
}

function NewsLetterForm(props: NewsLetterInputProps) {
  const {
    buttonText,
    width,
    placeholder,
    helpText,
    successText,
    inputBackgroundColor,
    borderRadius,
    ref,
    ...rest
  } = props;
  const fetcher = useFetcher();
  const { state, Form } = fetcher;
  const data = fetcher.data as CustomerApiPlayLoad;
  const { ok, errorMessage } = data || {};

  return (
    <div ref={ref} {...rest} className="mx-auto max-w-full">
      <Form
        method="POST"
        action="/api/customer"
        className="flex flex-col md:flex-row w-full items-center justify-center gap-[17px]"
        data-motion="fade-up"
      >
        <div
          className={clsx(
            inputVariants({ borderRadius }),
            "border-(--color-line)",
          )}
          style={{
            backgroundColor: inputBackgroundColor,
          }}
        >
          <input
            name="email"
            type="email"
            required
            placeholder={placeholder}
            className="p-3 leading-tight focus:outline-hidden placeholder:text-sm"
            style={{ width }}
          />
        </div>
        <Button
          type="submit"
          className="gap-3 self-stretch"
          loading={state === "submitting"}
        >
          {buttonText}
        </Button>
      </Form>

      <div
        className={clsx(
          "mx-auto mt-4 text-center font-medium text-sm",
          state === "idle" && data ? "visible" : "invisible",
          ok ? "text-green-700" : "text-red-700",
        )}
      >
        {ok ? successText : errorMessage || "Something went wrong"}
      </div>
    </div>
  );
}

export default NewsLetterForm;

export const schema = createSchema({
  type: "newsletter--form",
  title: "Form",
  settings: [
    {
      group: "Form",
      inputs: [
        {
          type: "range",
          name: "width",
          label: "Input width",
          configs: {
            min: 300,
            max: 600,
            step: 10,
            unit: "px",
          },
          defaultValue: 500,
        },
        {
          type: "text",
          name: "placeholder",
          label: "Placeholder",
          defaultValue: "Enter your email",
          placeholder: "Enter your email",
        },
        {
          type: "text",
          name: "successText",
          label: "Success message",
          placeholder: "🎉 Thank you for subscribing!",
          defaultValue: "🎉 Thank you for subscribing!",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          placeholder: "Subscribe",
          defaultValue: "Subscribe",
        },
      ],
    },
    {
      group: "Input styling",
      inputs: [
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
        {
          type: "color",
          name: "inputBackgroundColor",
          label: "Background color",
        },
      ],
    },
  ],
});
