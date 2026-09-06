import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef, useState } from "react";
import { Form, useFetcher } from "react-router";
import { Button } from "~/components/button";
import { cn } from "~/utils/cn";

interface B2BSignupProps extends HydrogenComponentProps {
  heading: string;
  description: string;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  ref?: React.Ref<HTMLElement>;
}

const B2BSignup = forwardRef<HTMLElement, B2BSignupProps>((props, ref) => {
  const formKey = "b2b-form";
  const {
    heading,
    description,
    buttonText,
    backgroundColor,
    textColor,
    ...rest
  } = props;
  const fetcher = useFetcher({ key: formKey });
  const [formState, setFormState] = useState({
    name: "",
    company: "",
    email: "",
    website: "",
    message: "",
  });

  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;
  const error = fetcher.data?.error;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section
      ref={ref}
      {...rest}
      className={cn("px-4 py-16")}
      style={{ color: textColor, backgroundColor }}
    >
      <div className="mx-auto max-w-[480px] space-y-6 rounded-2xl bg-white p-8">
        <div className="text-center space-y-[9px]">
          <h2 className="font-serif font-normal text-[32px] leading-[1.1] tracking-[-0.02em]">
            {heading}
          </h2>
          {description && (
            <p className="text-base text-body-subtle">{description}</p>
          )}
        </div>

        {isSuccess ? (
          <div className="rounded-lg border border-green-600 bg-green-50 p-6 text-center text-green-800">
            <p className="text-lg font-semibold">
              Thank you for your interest!
            </p>
            <p className="mt-2">We'll get back to you shortly.</p>
          </div>
        ) : (
          <Form
            method="post"
            action="/api/b2b-signup"
            navigate={false}
            fetcherKey={formKey}
            className="space-y-[17px]"
          >
            {error && (
              <div className="rounded-lg border border-red-600 bg-red-50 p-4 text-red-800">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                name="name"
                placeholder="Your name*"
                required
                value={formState.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-line px-3 py-[18px] text-base leading-none placeholder:text-body-subtle focus:outline-none"
              />
            </div>

            <div>
              <input
                type="text"
                name="company"
                placeholder="Company name"
                value={formState.company}
                onChange={handleChange}
                className="w-full rounded-xl border border-line px-3 py-[18px] text-base leading-none placeholder:text-body-subtle focus:outline-none"
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Contact email*"
                required
                value={formState.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-line px-3 py-[18px] text-base leading-none placeholder:text-body-subtle focus:outline-none"
              />
            </div>

            <div>
              <input
                type="url"
                name="website"
                placeholder="Website"
                value={formState.website}
                onChange={handleChange}
                className="w-full rounded-xl border border-line px-3 py-[18px] text-base leading-none placeholder:text-body-subtle focus:outline-none"
              />
            </div>

            <div>
              <textarea
                name="message"
                placeholder="Message"
                rows={5}
                value={formState.message}
                onChange={handleChange}
                className="w-full resize-none rounded-xl border border-line px-3 py-[18px] text-base placeholder:text-body-subtle focus:outline-none"
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {buttonText}
              </Button>
            </div>
          </Form>
        )}
      </div>
    </section>
  );
});

export default B2BSignup;

export const schema = createSchema({
  type: "b2b-signup",
  title: "B2B Signup",
  inspector: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Become a Reseller",
          placeholder: "Enter heading",
        },
        {
          type: "text",
          name: "description",
          label: "Description",
          defaultValue: "Complete the form to sign up",
          placeholder: "Enter description",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button Text",
          defaultValue: "Submit",
          placeholder: "Enter button text",
        },
      ],
    },
    {
      group: "Styling",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background Color",
          defaultValue: "#ffffff",
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
});
