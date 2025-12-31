import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import invariant from "tiny-invariant";
import {
  assignCustomerToCompanyMutation,
  companyCreateMutation,
  customerCreateMutation,
} from "~/graphql/customer.admin";

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { env } = context;
    const { WEAVERSE_HOST, WEAVERSE_API_KEY } = env;

    invariant(
      WEAVERSE_HOST && WEAVERSE_API_KEY,
      "WEAVERSE_HOST or WEAVERSE_API_KEY is not configured.",
    );

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const email = formData.get("email") as string;
    const website = formData.get("website") as string;
    const message = formData.get("message") as string;

    if (!(name && email)) {
      return data(
        { error: "Name and email are required fields" },
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
        throw new Error(`GraphQL request failed: ${response.status} ${errorText}`);
      }

      return response.json() as Promise<any>;
    };

    // Step 1: Create Company
    const companyResponse = await graphqlRequest(companyCreateMutation, {
      input: {
        company: {
          name: company,
          note: `Contact: ${name} (${email})\nWebsite: ${website}\nMessage: ${message}\nSubmitted at: ${new Date().toISOString()}`,
        },
      },
    });

    const companyErrors = companyResponse.data?.companyCreate?.userErrors;
    if (companyErrors?.length > 0) {
      return data(
        { error: `Company creation failed: ${companyErrors[0].message}` },
        { status: 400 },
      );
    }

    const companyId = companyResponse.data?.companyCreate?.company?.id;
    if (!companyId) {
      return data({ error: "Failed to create company" }, { status: 500 });
    }

    // Step 2: Create Customer
    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    const customerResponse = await graphqlRequest(customerCreateMutation, {
      input: {
        email,
        firstName: firstName || name,
        lastName: lastName || "",
      },
    });

    const customerErrors = customerResponse.data?.customerCreate?.userErrors;
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

    const customerId = customerResponse.data?.customerCreate?.customer?.id;
    if (!customerId) {
      return data({ error: "Failed to create customer" }, { status: 500 });
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
      assignResponse.data?.companyAssignCustomerAsContact?.userErrors;
    if (assignErrors?.length > 0) {
      return data(
        {
          error: `Failed to assign customer to company: ${assignErrors[0].message}`,
        },
        { status: 400 },
      );
    }

    return data(
      { success: true, companyId, customerId },
      { status: 200 },
    );
  } catch (error) {
    console.error("B2B signup error:", error);
    return data(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    );
  }
}
