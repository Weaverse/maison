import type { LoaderFunctionArgs } from "react-router";
import {
  draftOrderQuery,
  openDraftOrdersQuery,
} from "~/graphql/draft-order.admin";
import { normId } from "./headless";

/**
 * Reading the state of a draft order B2Bridge created.
 *
 * B2Bridge offers no way to ask whether an invoice has been paid, and the
 * payment happens on Shopify's own domain where this storefront sees nothing.
 * Shopify itself knows, so Shopify is who gets asked — through the same admin
 * proxy `($locale).api.b2b-signup.tsx` already uses, with the query kept in
 * `~/graphql/draft-order.admin` for the reason given there.
 */

type Context = LoaderFunctionArgs["context"];

/**
 * Three answers, not two.
 *
 * `missing` is Shopify telling us the draft is not there — someone deleted
 * it, and no amount of asking again will bring it back. `unreadable` is us
 * failing to ask: a timeout, a permission change, a bad gateway. Treating
 * them alike means either giving up on a cart whose order may well have been
 * paid, or asking Shopify the same settled question on every cart view for a
 * day.
 */
export type DraftOrderLookup =
  | {
      kind: "found";
      /** `OPEN`, `INVOICE_SENT` or `COMPLETED`. */
      status: string;
      /** What the buyer actually paid for, to take back out of their cart. */
      lines: { variantId: string; quantity: number }[];
    }
  | { kind: "missing" }
  | { kind: "unreadable" };

/** What became of a draft order, as far as Shopify can say. */
export async function readDraftOrder(
  context: Context,
  draftOrderId: string,
): Promise<DraftOrderLookup> {
  const { WEAVERSE_HOST, WEAVERSE_API_KEY } = context.env;
  if (!(WEAVERSE_HOST && WEAVERSE_API_KEY)) {
    return { kind: "unreadable" };
  }

  try {
    const response = await fetch(`${WEAVERSE_HOST}/api/admin-graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEAVERSE_API_KEY}`,
      },
      body: JSON.stringify({
        query: draftOrderQuery,
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

    if (payload.error) {
      console.warn("[B2Bridge] draft order lookup failed:", payload.error);
      return { kind: "unreadable" };
    }
    // Shopify answers `null` for an id it has no draft for. A definite answer,
    // not a failure to get one.
    if (!payload.draftOrder?.status) {
      console.warn("[B2Bridge] draft order no longer exists:", draftOrderId);
      return { kind: "missing" };
    }

    return {
      kind: "found",
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
    return { kind: "unreadable" };
  }
}

/**
 * A draft order Shopify already holds for this exact cart, if there is one.
 *
 * Matching is the whole invoice: the same variants in the same quantities.
 * Anything less would adopt an invoice for a different cart and send the
 * buyer to pay the wrong amount.
 *
 * Returns `null` when nothing matches, and also when Shopify cannot be
 * reached — the caller treats that as "nothing found", which is the cautious
 * side here only because the alternative is refusing every checkout whenever
 * the admin API is slow.
 */
export async function findOpenDraftForCart(
  context: Context,
  customerId: string,
  lines: { variantId: string; quantity: number }[],
  maxAgeMs: number,
): Promise<{
  draftOrderId: string;
  invoiceUrl: string;
  subtotal: number;
  currency: string;
} | null> {
  const { WEAVERSE_HOST, WEAVERSE_API_KEY } = context.env;
  if (!(WEAVERSE_HOST && WEAVERSE_API_KEY)) {
    return null;
  }
  const wanted = new Map(
    lines.map((line) => [normId(line.variantId), line.quantity]),
  );

  try {
    const response = await fetch(`${WEAVERSE_HOST}/api/admin-graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEAVERSE_API_KEY}`,
      },
      body: JSON.stringify({
        query: openDraftOrdersQuery,
        variables: { query: `customer_id:${normId(customerId)} status:open` },
      }),
      signal: AbortSignal.timeout(5000),
    });
    const payload = (await response.json()) as {
      data?: { draftOrders?: { nodes?: RawOpenDraft[] } };
      draftOrders?: { nodes?: RawOpenDraft[] };
    };
    const nodes =
      payload?.data?.draftOrders?.nodes ?? payload?.draftOrders?.nodes ?? [];

    for (const node of nodes) {
      if (Date.now() - Date.parse(node.createdAt ?? "") > maxAgeMs) {
        continue;
      }
      const held = new Map<string, number>();
      for (const item of node.lineItems?.nodes ?? []) {
        const variantId = normId(item.variant?.id ?? "");
        if (variantId) {
          held.set(variantId, (held.get(variantId) ?? 0) + item.quantity);
        }
      }
      if (held.size !== wanted.size) {
        continue;
      }
      let same = true;
      for (const [variantId, quantity] of wanted) {
        if (held.get(variantId) !== quantity) {
          same = false;
          break;
        }
      }
      if (same && node.id && node.invoiceUrl) {
        return {
          draftOrderId: node.id,
          invoiceUrl: node.invoiceUrl,
          subtotal: Number(node.subtotalPrice ?? 0),
          currency: node.currencyCode ?? "",
        };
      }
    }
    return null;
  } catch (error) {
    console.warn(
      "[B2Bridge] open draft order lookup failed:",
      (error as Error)?.message,
    );
    return null;
  }
}

interface RawOpenDraft {
  id?: string;
  invoiceUrl?: string;
  createdAt?: string;
  subtotalPrice?: string;
  currencyCode?: string;
  lineItems?: { nodes?: { quantity: number; variant?: { id?: string } }[] };
}
