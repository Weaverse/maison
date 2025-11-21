import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import invariant from "tiny-invariant";

interface B2BSignupData {
  name: string;
  company: string;
  email: string;
  website: string;
  message: string;
  submittedAt: string;
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { env } = context;
    const { HEADLESS_B2B_HOST, HEADLESS_B2B_TOKEN } = env;

    invariant(
      HEADLESS_B2B_HOST && HEADLESS_B2B_TOKEN,
      "HEADLESS_B2B_HOST or HEADLESS_B2B_TOKEN is not configured.",
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

    const signupData: B2BSignupData = {
      name, 
      company,
      email,
    };

    const response = await fetch(`${HEADLESS_B2B_HOST}/api/submit-form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HEADLESS_B2B_TOKEN}`,
      },
      body: JSON.stringify(signupData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return data(
        { error: "Failed to submit signup request", details: errorData },
        { status: response.status },
      );
    }

    const responseData = await response.json().catch(() => ({}));
    return data({ success: true, data: responseData }, { status: response.status });
  } catch (error) {
    console.error("B2B signup error:", error);
    return data(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    );
  }
}
