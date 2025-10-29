import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { CustomerApiPlayLoad } from "~/routes/($locale).api.customer";

interface NewsLetterInputProps extends HydrogenComponentProps {
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
        className="flex flex-col md:flex-row w-full items-center justify-center gap-[17px]"
        data-motion="fade-up"
      >
        <input
          name="email"
          type="email"
          required
          placeholder={placeholder}
          className="w-full md:w-[400px] p-3 leading-tight border rounded-sm focus:outline-hidden"
          style={{
            borderColor: inputBorderColor,
            backgroundColor: inputBackgroundColor,
          }}
        />
        <Button
          type="submit"
          className="gap-3"
          loading={state === "submitting"}
        >
          {buttonText}
        </Button>
      </Form>

      {state === "idle" && data && (
        <div
          className={clsx(
            "mx-auto mt-4 text-center font-medium",
            ok ? "text-green-700" : "text-red-700",
          )}
        >
          {ok ? successText : errorMessage || "Something went wrong"}
        </div>
      )}
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
