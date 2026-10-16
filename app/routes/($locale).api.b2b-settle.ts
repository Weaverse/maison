import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import {
  CHECKOUT_PENDING_MS,
  clearCheckoutMark,
  readCheckoutMark,
} from "~/utils/b2bridge/cart.server";
import { readDraftOrder } from "~/utils/b2bridge/draft-order.server";
import { adjustmentForPaidLines } from "~/utils/b2bridge/headless";

/**
 * Takes a paid order back out of the cart.
 *
 * The buyer is sent to Shopify's domain to pay and nothing comes back to say
 * whether they did, so the cart is settled the next time they are here: ask
 * Shopify what became of the draft order, and act only on what it says.
 *
 * Subtracts rather than empties — see `adjustmentForPaidLines`. A cart can
 * hold things that were added after the invoice was raised, and those were
 * never paid for.
 *
 * A POST because it changes the cart. Safe to call when there is nothing to
 * do: it answers `settled: false` and leaves everything alone.
 */
export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data(
      { settled: false },
      { status: 405, headers: { Allow: "POST" } },
    );
  }

  const pending = readCheckoutMark(context);
  if (!pending?.draftOrderId) {
    return data({ settled: false });
  }

  // Long past the point where the buyer was going to come back for it.
  if (Date.now() - pending.at > CHECKOUT_PENDING_MS) {
    clearCheckoutMark(context);
    return data({ settled: false });
  }

  const draft = await readDraftOrder(context, pending.draftOrderId);

  // Unreadable is not the same as unpaid: keep the record and try again next
  // time rather than leave the cart holding goods that are already bought.
  if (draft.kind === "unreadable") {
    return data({ settled: false });
  }
  // Deleted. Nothing was ever paid against it and nothing ever will be, so
  // the cart stands as it is and the note goes — keeping it would mean asking
  // Shopify the same settled question on every cart view for a day.
  if (draft.kind === "missing") {
    clearCheckoutMark(context);
    return data({ settled: false });
  }
  if (draft.status !== "COMPLETED") {
    return data({ settled: false });
  }

  const cart = await context.cart.get();
  const cartLines = (cart?.lines?.nodes ?? []).map((node) => ({
    id: node.id,
    variantId: node.merchandise?.id ?? "",
    quantity: node.quantity,
  }));
  const { updates, removals } = adjustmentForPaidLines(cartLines, draft.lines);

  const headers = new Headers();
  try {
    let latest = cart;
    if (updates.length > 0) {
      latest = (await context.cart.updateLines(updates)).cart;
    }
    if (removals.length > 0) {
      latest = (await context.cart.removeLines(removals)).cart;
    }
    if (latest?.id) {
      for (const [name, value] of context.cart.setCartId(latest.id)) {
        headers.append(name, value);
      }
    }
  } catch (error) {
    console.warn("[B2Bridge] cart not settled:", (error as Error)?.message);
    return data({ settled: false });
  }

  clearCheckoutMark(context);
  return data({ settled: true }, { headers });
}
