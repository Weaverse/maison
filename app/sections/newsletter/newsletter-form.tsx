import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { CustomerApiPlayLoad } from "~/routes/($locale).api.customer";

interface NewsLetterInputProps extends HydrogenComponentProps {
  width: number;
  placeholder: string;
  buttonText: string;
  helpText: string;
  successText?: string;
  inputBorderColor?: string;
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
    inputBorderColor,
    inputBackgroundColor,
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
        className="flex w-full items-center justify-center gap-[17px]"
        data-motion="fade-up"
      >
        <div
          className="flex items-center border rounded-sm"
          style={{
            width,
            borderColor: inputBorderColor,
            backgroundColor: inputBackgroundColor,
          }}
        >
          <input
            name="email"
            type="email"
            required
            placeholder={placeholder}
            className="w-full p-3 leading-tight focus:outline-hidden"
          />
        </div>
        <Button
          type="submit"
          className="gap-3"
          loading={state === "submitting"}
        >
          {buttonText}
        </Button>
      </Form>
      <div
        className={clsx(
          "mx-auto mt-4 text-center font-medium",
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
          defaultValue: "Enter your email*",
          placeholder: "Enter your email*",
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
          placeholder: "Submit",
          defaultValue: "Submit",
        },
      ],
    },
    {
      group: "Input styling",
      inputs: [
        {
          type: "color",
          name: "inputBorderColor",
          label: "Border color",
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
