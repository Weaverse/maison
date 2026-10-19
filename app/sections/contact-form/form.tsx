import {
  createSchema,
  type HydrogenComponentProps,
  useTranslation,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Form, useFetcher } from "react-router";
import { Button } from "~/components/button";

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

/** What `/api/contact` answers with. */
type ContactResponse = { ok?: boolean; error?: string };

/**
 * One key for the form element and the fetcher that reads its state.
 *
 * `navigate={false}` keeps the submission out of the router's navigation, so
 * the result is only reachable through a fetcher holding the same key.
 */
const FORM_KEY = "contact-form";

interface ContactFormProps
  extends VariantProps<typeof inputVariants>,
    HydrogenComponentProps {
  gap?: number;
  inputBorderColor?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  placeholderColor?: string;
  buttonText?: string;
  ref?: React.Ref<HTMLFormElement>;
}

const ContactForm = (props: ContactFormProps) => {
  const { t } = useTranslation();
  const {
    ref,
    gap,
    inputBorderColor,
    inputBackgroundColor,
    inputTextColor,
    placeholderColor,
    borderRadius,
    buttonText,
    ...rest
  } = props;

  const fetcher = useFetcher<ContactResponse>({ key: FORM_KEY });
  const isSubmitting = fetcher.state === "submitting";
  const { ok, error } = fetcher.data ?? {};

  const fieldStyle = {
    border: `1px solid ${inputBorderColor}`,
    backgroundColor: inputBackgroundColor,
    color: inputTextColor,
  };
  const fieldClass = inputVariants({ borderRadius });
  const rowStyle = { gap: `${gap}px` };

  // The caps match `/api/contact`, which rejects anything longer. Enforcing
  // them here as well means the buyer is stopped by the field rather than by
  // an error message after a round trip.
  const maxLengths = {
    name: 200,
    company: 200,
    email: 254,
    website: 500,
    message: 5000,
  };

  if (ok) {
    return (
      <div
        {...rest}
        className="flex max-w-[640px] w-full flex-col items-center rounded-lg border border-green-600 bg-green-50 p-6 text-center text-green-800"
      >
        <p className="font-semibold text-lg">{t("form.thankYou")}</p>
        <p className="mt-2">{t("form.willReply")}</p>
      </div>
    );
  }

  return (
    <Form
      ref={ref}
      {...rest}
      method="post"
      action="/api/contact"
      navigate={false}
      fetcherKey={FORM_KEY}
      className="flex flex-col items-center max-w-[640px] w-full"
      style={
        {
          gap: `${gap}px`,
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

      {error && (
        <div className="w-full rounded-xl border border-red-600 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row w-full" style={rowStyle}>
        <input
          type="text"
          name="name"
          autoComplete="name"
          required
          maxLength={maxLengths.name}
          placeholder={t("form.nameRequired")}
          className={fieldClass}
          style={fieldStyle}
        />
        <input
          type="text"
          name="company"
          autoComplete="organization"
          maxLength={maxLengths.company}
          placeholder={t("form.company")}
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      <div className="flex flex-col sm:flex-row w-full" style={rowStyle}>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={maxLengths.email}
          placeholder={t("form.email")}
          className={fieldClass}
          style={fieldStyle}
        />
        <input
          type="url"
          name="website"
          autoComplete="url"
          maxLength={maxLengths.website}
          placeholder={t("form.website")}
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      <textarea
        name="message"
        required
        maxLength={maxLengths.message}
        placeholder={t("form.messageRequired")}
        className={`${fieldClass} h-[116px] resize-none`}
        style={fieldStyle}
      />

      {/* The submit button belongs to this component, not to the section: the
          section's `button` child is the theme's `button` type, which renders a
          `Link` — an `<a>`, and an anchor can never submit a form. A page saved
          with that child keeps rendering it as the link it always was; this is
          the control that actually sends the submission. */}
      <Button type="submit" variant="primary" loading={isSubmitting}>
        {buttonText || t("form.submit")}
      </Button>
    </Form>
  );
};

export default ContactForm;

export const schema = createSchema({
  type: "contact-form-fields",
  title: "Contact form fields",
  childTypes: [],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Submit",
          placeholder: "Submit",
        },
      ],
    },
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
