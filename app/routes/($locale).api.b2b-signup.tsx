import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { companyCreateMutation } from "~/graphql/customer.admin";
import { isSameOriginPost } from "~/utils/request-security.server";

const MAX_LENGTHS = {
  name: 200,
  company: 200,
  email: 254,
  website: 500,
  message: 5000,
} as const;

/** `get` yields null for a field the request never sent. */
function readField(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }
  // This endpoint creates a real Shopify company and customer, so it only
  // answers submissions that came from the storefront itself.
  if (!isSameOriginPost(request)) {
    return data({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();

    const name = readField(formData, "name");
    const company = readField(formData, "company");
    const email = readField(formData, "email");
    const website = readField(formData, "website");
    const message = readField(formData, "message");

    // Company is as mandatory as the rest: step one of this flow is
    // `companyCreate`, and Shopify rejects a company without a name — so an
    // empty field failed at Shopify after the submission looked accepted.
    if (!(name && company && email && message)) {
      return data(
        { error: "Name, company, email and message are required fields" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return data(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // The browser enforces the same caps, so anything longer reached us
    // another way. A company note is the only place these end up, and it has
    // no business holding an unbounded string.
    for (const [field, value] of Object.entries({
      name,
      company,
      email,
      website,
      message,
    })) {
      const max = MAX_LENGTHS[field as keyof typeof MAX_LENGTHS];
      if (value.length > max) {
        return data(
          { error: `${field} must be ${max} characters or fewer` },
          { status: 400 },
        );
      }
    }

    const { env } = context;
    const { WEAVERSE_HOST, WEAVERSE_API_KEY } = env;

    // Both are commented out in `.env.example`, so an unconfigured store is
    // the likely state. Say so plainly instead of throwing into the catch,
    // which answered every submission with the same opaque 500.
    const missing = [
      WEAVERSE_HOST ? null : "WEAVERSE_HOST",
      WEAVERSE_API_KEY ? null : "WEAVERSE_API_KEY",
    ].filter(Boolean);
    if (missing.length) {
      console.error(`B2B signup unavailable: ${missing.join(" and ")} not set`);
      return data(
        {
          error: "This form is not configured yet. Please contact us directly.",
        },
        { status: 503 },
      );
    }

    const graphqlRequest = async (query: string, variables: any) => {
      const response = await fetch(`${WEAVERSE_HOST}/api/admin-graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WEAVERSE_API_KEY}`,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `GraphQL request failed: ${response.status} ${errorText}`,
        );
      }

      return response.json() as Promise<any>;
    };

    // One mutation, so there is nothing to unwind.
    //
    // This ran as three — customer, company, assign — and each order had its
    // own failure. Company first left an orphaned, contactless company behind
    // whenever the customer step was refused. Customer first wrote the email
    // before the company could be refused, which was worse: the retry died on
    // "Email has already been taken" without ever reaching company creation
    // again, so one transient failure locked that address out of the form for
    // good.
    //
    // `companyCreate` accepts the contact, so Shopify creates the customer,
    // the contact and the company together or does none of it. A failure
    // leaves nothing behind and the buyer can simply submit again.
    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    const companyResponse = await graphqlRequest(companyCreateMutation, {
      input: {
        company: {
          name: company,
          note: `Contact: ${name} (${email})\nWebsite: ${website}\nMessage: ${message}\nSubmitted at: ${new Date().toISOString()}`,
        },
        companyContact: {
          email,
          firstName: firstName || name,
          lastName: lastName || "",
        },
      },
    });

    const companyErrors = companyResponse?.companyCreate?.userErrors;
    if (companyErrors?.length > 0) {
      const [{ code, message: reason }] = companyErrors;
      // A duplicate email is the one failure the buyer can act on, and
      // Shopify's own wording does not say so. Everything else is reported as
      // it came back. `code` rather than the message text, so this keeps
      // working in a shop running another language.
      if (code === "TAKEN") {
        return data(
          {
            error:
              "An account already exists for this email address. Please contact us directly.",
          },
          { status: 409 },
        );
      }
      return data({ error: `Signup failed: ${reason}` }, { status: 400 });
    }

    const createdCompany = companyResponse?.companyCreate?.company;
    const companyId = createdCompany?.id;
    const customerId = createdCompany?.mainContact?.customer?.id;
    if (!companyId) {
      return data({ error: "Failed to create company" }, { status: 500 });
    }

    return data(
      { success: true, companyId, customerId: customerId ?? null },
      { status: 200 },
    );
  } catch (error) {
    console.error("B2B signup error:", error);
    // The proxy answers a missing Admin API scope with 403 ACCESS_DENIED.
    // That is a setup problem, not a bad submission, and it deserves to be
    // readable instead of hidden behind the generic message.
    const detail = error instanceof Error ? error.message : String(error);
    if (detail.includes("ACCESS_DENIED") || detail.includes("403")) {
      return data(
        {
          error:
            "This form is not permitted to create accounts yet. Please contact us directly.",
        },
        { status: 502 },
      );
    }
    return data(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    );
  }
}
