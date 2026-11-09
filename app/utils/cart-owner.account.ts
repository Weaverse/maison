import type { HydrogenSession } from "@shopify/hydrogen";
import type { AppLoadContext } from "react-router";

/** A transient auth failure must not be mistaken for a signed-out customer. */
export type CartCustomerSubject = string | null | undefined;

function accessTokenPresent(session: HydrogenSession): boolean {
  const account = session.get("customerAccount") as unknown;
  return (
    account !== null &&
    typeof account === "object" &&
    "accessToken" in account &&
    typeof account.accessToken === "string" &&
    account.accessToken.length > 0
  );
}

function tokenSubject(session: HydrogenSession): string | undefined {
  const account = session.get("customerAccount") as unknown;
  if (
    !account ||
    typeof account !== "object" ||
    !("idToken" in account) ||
    typeof account.idToken !== "string"
  ) {
    return undefined;
  }

  try {
    const payload = account.idToken.split(".")[1];
    if (!payload) {
      return undefined;
    }
    const parsed = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "sub" in parsed &&
      typeof parsed.sub === "string" &&
      parsed.sub.length > 0
    ) {
      return parsed.sub;
    }
  } catch {
    // A malformed token is unavailable, never a guest identity.
  }
  return undefined;
}

/** null = guest, undefined = signed-in state could not be verified. */
export async function currentCartCustomerSubject(
  customerAccount: AppLoadContext["customerAccount"],
  session: HydrogenSession,
): Promise<CartCustomerSubject> {
  if (!accessTokenPresent(session)) {
    const account = session.get("customerAccount") as unknown;
    if (
      account &&
      typeof account === "object" &&
      ("idToken" in account ||
        "refreshToken" in account ||
        "expiresAt" in account)
    ) {
      return undefined;
    }
    return null;
  }

  try {
    if (!(await customerAccount.isLoggedIn())) {
      // Hydrogen returns false both on logout and on a failed token refresh.
      return accessTokenPresent(session) ? undefined : null;
    }
  } catch {
    return undefined;
  }

  return tokenSubject(session);
}
