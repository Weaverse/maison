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
 * An unreadable or incomplete result is distinct from a definite miss: only
 * the latter is safe to use as evidence for creating a fresh draft order.
 */
export async function findOpenDraftForCart(
  context: Context,
  customerId: string,
  lines: { variantId: string; quantity: number }[],
  attemptAt: number,
): Promise<OpenDraftLookup> {
  const { WEAVERSE_HOST, WEAVERSE_API_KEY } = context.env;
  if (!(WEAVERSE_HOST && WEAVERSE_API_KEY)) {
    return { kind: "unreadable" };
  }
  const wanted = new Map(
    lines.map((line) => [normId(line.variantId), line.quantity]),
  );

  try {
    let after: string | null = null;
    const candidates: Extract<OpenDraftLookup, { kind: "found" }>[] = [];
    // A small clock-skew allowance keeps a draft whose Shopify timestamp
    // precedes ours by a few seconds in scope. Scan every page: the proxy's
    // draftOrders query does not accept a CREATED_AT sort key, so an older
    // result is not proof that subsequent results are older too.
    const earliest = attemptAt - 30_000;
    for (let page = 0; page < 20; page += 1) {
      const response = await fetch(`${WEAVERSE_HOST}/api/admin-graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WEAVERSE_API_KEY}`,
        },
        body: JSON.stringify({
          query: openDraftOrdersQuery,
          variables: {
            query: `customer_id:${normId(customerId)}`,
            after,
          },
        }),
        signal: AbortSignal.timeout(5000),
      });
      const payload = (await response.json()) as {
        data?: { draftOrders?: RawOpenDraftConnection };
        draftOrders?: RawOpenDraftConnection;
        errors?: unknown[];
        error?: string;
      };
      if (!response.ok || payload.error || payload.errors?.length) {
        return { kind: "unreadable" };
      }
      const connection = payload.data?.draftOrders ?? payload.draftOrders;
      if (!connection?.nodes || !connection.pageInfo) {
        return { kind: "unreadable" };
      }

      for (const node of connection.nodes) {
        const candidate = candidateForDraft(node, wanted, earliest);
        if (candidate?.kind === "unreadable") {
          return { kind: "unreadable" };
        }
        if (candidate?.kind === "found") {
          candidates.push(candidate);
          // Variant/quantity matching is not a unique draft identifier. If
          // two drafts match the lost attempt's time window, choosing one
          // could charge or settle the wrong invoice.
          if (candidates.length > 1) {
            return { kind: "unreadable" };
          }
        }
      }
      if (!connection.pageInfo.hasNextPage) {
        return candidates[0] ?? { kind: "missing" };
      }
      if (!connection.pageInfo.endCursor) {
        return { kind: "unreadable" };
      }
      after = connection.pageInfo.endCursor;
    }
    // Do not infer absence from a truncated search.
    return { kind: "unreadable" };
  } catch (error) {
    console.warn(
      "[B2Bridge] open draft order lookup failed:",
      (error as Error)?.message,
    );
    return { kind: "unreadable" };
  }
}

export type OpenDraftLookup =
  | {
      kind: "found";
      draft: {
        draftOrderId: string;
        invoiceUrl: string;
        status: string;
        subtotal: number;
        currency: string;
      };
    }
  | { kind: "missing" | "unreadable" };

interface RawOpenDraftConnection {
  nodes: RawOpenDraft[];
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
}

interface RawOpenDraft {
  id?: string;
  invoiceUrl?: string;
  status?: string;
  createdAt?: string;
  subtotalPrice?: string;
  currencyCode?: string;
  lineItems?: {
    nodes?: { quantity: number; variant?: { id?: string } }[];
    pageInfo?: { hasNextPage: boolean };
  };
}

function candidateForDraft(
  node: RawOpenDraft,
  wanted: Map<string, number>,
  earliest: number,
): Extract<OpenDraftLookup, { kind: "found" }> | { kind: "unreadable" } | null {
  const createdAt = Date.parse(node.createdAt ?? "");
  if (!Number.isFinite(createdAt)) {
    return { kind: "unreadable" };
  }
  if (createdAt < earliest) {
    return null;
  }
  if (
    !node.lineItems?.nodes ||
    node.lineItems.pageInfo?.hasNextPage !== false
  ) {
    return { kind: "unreadable" };
  }

  const held = new Map<string, number>();
  for (const item of node.lineItems.nodes) {
    const variantId = normId(item.variant?.id ?? "");
    if (variantId) {
      held.set(variantId, (held.get(variantId) ?? 0) + item.quantity);
    }
  }
  if (held.size !== wanted.size) {
    return null;
  }
  for (const [variantId, quantity] of wanted) {
    if (held.get(variantId) !== quantity) {
      return null;
    }
  }
  if (node.status === "CANCELLED") {
    return null;
  }
  if (
    !node.id ||
    !node.status ||
    !["COMPLETED", "OPEN", "INVOICE_SENT"].includes(node.status) ||
    (node.status !== "COMPLETED" && !node.invoiceUrl) ||
    !node.currencyCode ||
    !Number.isFinite(Number(node.subtotalPrice))
  ) {
    return { kind: "unreadable" };
  }
  return {
    kind: "found",
    draft: {
      draftOrderId: node.id,
      invoiceUrl: node.invoiceUrl ?? "",
      status: node.status,
      subtotal: Number(node.subtotalPrice),
      currency: node.currencyCode,
    },
  };
}
