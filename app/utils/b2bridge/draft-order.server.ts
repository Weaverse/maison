import type { LoaderFunctionArgs } from "react-router";

/**
 * Reading the state of a draft order B2Bridge created.
 *
 * B2Bridge offers no way to ask whether an invoice has been paid, and the
 * payment happens on Shopify's own domain where this storefront sees nothing.
 * Shopify itself knows, so Shopify is who gets asked — through the same admin
 * proxy `($locale).api.b2b-signup.tsx` already uses.
 *
 * Deliberately does not ask for the `order` the draft became: that field needs
 * the `read_orders` scope, while `status` and `lineItems` need only
 * `read_draft_orders`, and `COMPLETED` already answers the question.
 */

type Context = LoaderFunctionArgs["context"];

const DRAFT_ORDER_QUERY = `#graphql
  query B2BridgeDraftOrder($id: ID!) {
    draftOrder(id: $id) {
      id
      status
      lineItems(first: 250) {
        nodes {
          quantity
          variant {
            id
          }
        }
      }
    }
  }
`;

export interface DraftOrderState {
  /** `OPEN`, `INVOICE_SENT` or `COMPLETED`. */
  status: string;
  /** What the buyer actually paid for, to take back out of their cart. */
  lines: { variantId: string; quantity: number }[];
}

/** The draft's current state, or `null` when it cannot be read. */
export async function readDraftOrder(
  context: Context,
  draftOrderId: string,
): Promise<DraftOrderState | null> {
  const { WEAVERSE_HOST, WEAVERSE_API_KEY } = context.env;
  if (!(WEAVERSE_HOST && WEAVERSE_API_KEY)) {
    return null;
  }

  try {
    const response = await fetch(`${WEAVERSE_HOST}/api/admin-graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEAVERSE_API_KEY}`,
      },
      body: JSON.stringify({
        query: DRAFT_ORDER_QUERY,
        variables: { id: draftOrderId },
      }),
      signal: AbortSignal.timeout(5000),
    });
    const payload = (await response.json()) as {
      draftOrder?: {
        status?: string;
        lineItems?: {
          nodes?: { quantity: number; variant?: { id?: string } }[];
        };
      };
      error?: string;
    };

    if (payload.error || !payload.draftOrder?.status) {
      console.warn(
        "[B2Bridge] draft order lookup failed:",
        payload.error ?? "no draft order in response",
      );
      return null;
    }

    return {
      status: payload.draftOrder.status,
      lines: (payload.draftOrder.lineItems?.nodes ?? [])
        .filter((node) => node.variant?.id)
        .map((node) => ({
          variantId: node.variant?.id ?? "",
          quantity: node.quantity,
        })),
    };
  } catch (error) {
    console.warn(
      "[B2Bridge] draft order lookup failed:",
      (error as Error)?.message,
    );
    return null;
  }
}
