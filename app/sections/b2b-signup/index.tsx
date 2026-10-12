import {
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
} from "@weaverse/hydrogen";
import { forwardRef, useState } from "react";
import { Form, useFetcher } from "react-router";
import { Button } from "~/components/button";
import { cn } from "~/utils/cn";

interface B2BSignupProps extends HydrogenComponentProps {
  heading: string;
  description: string;
  buttonText: string;
  termsText?: string;
  backgroundColor: string;
  textColor: string;
  ref?: React.Ref<HTMLElement>;
}

const FIELD_CLASS =
  "w-full rounded-xl border border-line px-3 py-[18px] text-base leading-none placeholder:text-body-subtle focus:outline-none";

const B2BSignup = forwardRef<HTMLElement, B2BSignupProps>((props, ref) => {
  const { t } = useTranslation();
  const formKey = "b2b-form";
  const {
    heading,
    description,
    buttonText,
    termsText,
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
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4">
        <div className="space-y-[9px] text-center">
          <h2 className="font-serif font-normal text-[32px] leading-[1.1] tracking-[-0.02em]">
            {heading}
          </h2>
          {description && (
            <p className="text-base text-body-subtle">{description}</p>
          )}
        </div>

        {isSuccess ? (
          <div className="rounded-lg border border-green-600 bg-green-50 p-6 text-center text-green-800">
            <p className="text-lg font-semibold">{t("form.thankYou")}</p>
            <p className="mt-2">{t("form.willReply")}</p>
          </div>
        ) : (
          <Form
            method="post"
            action="/api/b2b-signup"
            navigate={false}
            fetcherKey={formKey}
            className="flex w-full flex-col gap-4"
          >
            {error && (
              <div className="rounded-xl border border-red-600 bg-red-50 p-4 text-red-800">
                {error}
              </div>
            )}

            {/* Two fields to a row from `sm` up, stacked below — the layout the
                design asks for, and what keeps the message box the only
                full-width field. */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder={t("form.nameRequired")}
                required
                maxLength={200}
                value={formState.name}
                onChange={handleChange}
                className={FIELD_CLASS}
              />
              <input
                type="text"
                name="company"
                autoComplete="organization"
                placeholder={t("form.companyRequired")}
                required
                maxLength={200}
                value={formState.company}
                onChange={handleChange}
                className={FIELD_CLASS}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder={t("form.email")}
                required
                maxLength={254}
                value={formState.email}
                onChange={handleChange}
                className={FIELD_CLASS}
              />
              <input
                type="url"
                name="website"
                autoComplete="url"
                placeholder={t("form.website")}
                maxLength={500}
                value={formState.website}
                onChange={handleChange}
                className={FIELD_CLASS}
              />
            </div>

            <textarea
              name="message"
              placeholder={t("form.messageRequired")}
              required
              maxLength={5000}
              value={formState.message}
              onChange={handleChange}
              className={cn(
                FIELD_CLASS,
                "h-[116px] resize-none leading-normal",
              )}
            />

            <div className="flex justify-center">
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {buttonText}
              </Button>
            </div>

            {termsText && (
              <p className="text-center text-body-subtle text-xs">
                {termsText}
              </p>
            )}
          </Form>
        )}
      </div>
    </section>
  );
});

export default B2BSignup;

export const schema = createSchema({
  type: "b2b-signup",
  // The type is the key Weaverse stores against, so it stays put; only the
  // name merchants see changes.
  title: "Contact us",
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
        {
          type: "text",
          name: "termsText",
          label: "Terms text",
          defaultValue:
            "By submitting you have read and agree to the Terms of Use and Privacy Policy.",
          placeholder: "Enter terms text",
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
