import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import {
  assignCustomerToCompanyMutation,
  companyCreateMutation,
  customerCreateMutation,
} from "~/graphql/customer.admin";
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

    // Step 1: Create Customer
    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    const customerResponse = await graphqlRequest(customerCreateMutation, {
      input: {
        email,
        firstName: firstName || name,
        lastName: lastName || "",
      },
    });

    const customerErrors = customerResponse?.customerCreate?.userErrors;
    if (customerErrors?.length > 0) {
      // If customer already exists, we might want to proceed or handle it.
      // For now, fail as per requirement to report errors.
      // But typically check if error is "Email has already been taken" and query customer instead.
      // Given the prompt examples don't handle that complexity, I'll stick to error reporting.
      return data(
        { error: `Customer creation failed: ${customerErrors[0].message}` },
        { status: 400 },
      );
    }

    const customerId = customerResponse?.customerCreate?.customer?.id;
    if (!customerId) {
      return data({ error: "Failed to create customer" }, { status: 500 });
    }

    // Step 2: Create the company. The customer goes first because it is the
    // step that can be refused — a duplicate email, or a missing
    // `write_customers` scope on the connected app. Creating the company
    // first left an orphaned, contactless company behind on every failure.
    const companyResponse = await graphqlRequest(companyCreateMutation, {
      input: {
        company: {
          name: company,
          note: `Contact: ${name} (${email})\nWebsite: ${website}\nMessage: ${message}\nSubmitted at: ${new Date().toISOString()}`,
        },
      },
    });

    const companyErrors = companyResponse?.companyCreate?.userErrors;
    if (companyErrors?.length > 0) {
      return data(
        { error: `Company creation failed: ${companyErrors[0].message}` },
        { status: 400 },
      );
    }

    const companyId = companyResponse.companyCreate?.company?.id;
    if (!companyId) {
      return data({ error: "Failed to create company" }, { status: 500 });
    }

    // Step 3: Assign Customer to Company
    const assignResponse = await graphqlRequest(
      assignCustomerToCompanyMutation,
      {
        companyId,
        customerId,
      },
    );

    const assignErrors =
      assignResponse?.companyAssignCustomerAsContact?.userErrors;
    if (assignErrors?.length > 0) {
      return data(
        {
          error: `Failed to assign customer to company: ${assignErrors[0].message}`,
        },
        { status: 400 },
      );
    }

    return data({ success: true, companyId, customerId }, { status: 200 });
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
