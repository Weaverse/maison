import {
  type ActionFunction,
  type ActionFunctionArgs,
  data,
} from "react-router";

const KLAVIYO_API = "https://a.klaviyo.com/api/profiles";
const GENERIC_ERROR = "Something went wrong! Please try again.";
const INVALID_EMAIL_ERROR = "Please enter a valid email address.";

type KlaviyoErrorPayload = {
  errors?: {
    code?: string;
    status?: number;
    detail?: string;
  }[];
};

function hasErrorCode(payload: KlaviyoErrorPayload, code: string) {
  return Boolean(payload?.errors?.some((error) => error.code === code));
}

async function readErrorPayload(res: Response): Promise<KlaviyoErrorPayload> {
  try {
    return (await res.json()) as KlaviyoErrorPayload;
  } catch {
    return {};
  }
}

export const action: ActionFunction = async ({
  request,
  context,
}: ActionFunctionArgs) => {
  const apiToken = context.env.KLAVIYO_PRIVATE_API_TOKEN;
  if (!apiToken) {
    console.error(
      "Klaviyo signup unavailable: KLAVIYO_PRIVATE_API_TOKEN is not set",
    );
    return data({ ok: false, error: GENERIC_ERROR }, 503);
  }

  const formData = await request.formData();
  const email = formData.get("email");
  if (typeof email !== "string" || !email) {
    return data({ ok: false, error: "Email is required" }, 400);
  }

  try {
    const res = await fetch(KLAVIYO_API, {
      method: "POST",
      headers: {
        accept: "application/vnd.api+json",
        revision: "2024-10-15",
        "content-type": "application/vnd.api+json",
        Authorization: `Klaviyo-API-Key ${apiToken}`,
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: { email },
        },
      }),
    });

    if (res.ok) {
      // Drain the body. An unread response stream keeps the request's I/O
      // context alive in workerd, and the worker then never produces a
      // response ("The script will never generate a response").
      await res.body?.cancel();
      return data({ ok: true }, 201);
    }

    const payload = await readErrorPayload(res);

    // Already on the list — nothing to create, but the visitor is subscribed.
    if (res.status === 409 && hasErrorCode(payload, "duplicate_profile")) {
      return data({ ok: true }, 200);
    }

    // Klaviyo error details can identify existing profiles, so keep them server-side.
    console.error(
      `Klaviyo signup failed with status ${res.status}:`,
      JSON.stringify(payload),
    );

    if (res.status === 400) {
      return data({ ok: false, error: INVALID_EMAIL_ERROR }, 400);
    }
    return data({ ok: false, error: GENERIC_ERROR }, res.status);
  } catch (error) {
    console.error("Klaviyo signup request failed:", error);
    return data({ ok: false, error: GENERIC_ERROR }, 500);
  }
};
