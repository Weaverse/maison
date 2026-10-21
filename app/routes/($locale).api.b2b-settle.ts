import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import {
  CHECKOUT_PENDING_MS,
  clearCheckoutMark,
  readCheckoutMarks,
  recordSettlementProgress,
} from "~/utils/b2bridge/cart.server";
import { readDraftOrder } from "~/utils/b2bridge/draft-order.server";
import {
  adjustmentForPaidLines,
  type LineAdjustment,
  remainingPaidLines,
} from "~/utils/b2bridge/headless";

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
 * Every unresolved invoice is asked about, not only the most recent. A buyer
 * who raises a second invoice and then pays the first was left holding the
 * whole cart, because the one record kept pointed at the draft order they did
 * not pay.
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

  const pending = readCheckoutMarks(context);
  if (pending.length === 0) {
    return data({ settled: false });
  }

  const headers = new Headers();
  let settled = false;

  // Oldest first, and the cart is read again for each one: settling an
  // invoice changes the cart the next is measured against.
  for (const invoice of pending) {
    // Long past the point where the buyer was going to come back for it.
    if (Date.now() - invoice.at > CHECKOUT_PENDING_MS) {
      clearCheckoutMark(context, invoice.draftOrderId);
      continue;
    }

    const draft = await readDraftOrder(context, invoice.draftOrderId);

    // Unreadable is not the same as unpaid: keep the record and try again
    // next time rather than leave the cart holding goods already bought.
    if (draft.kind === "unreadable") {
      continue;
    }
    // Deleted. Nothing was ever paid against it and nothing ever will be, so
    // the cart stands as it is and the note goes — keeping it would mean
    // asking Shopify the same settled question on every cart view for a day.
    if (draft.kind === "missing") {
      clearCheckoutMark(context, invoice.draftOrderId);
      continue;
    }
    if (draft.status !== "COMPLETED") {
      continue;
    }

    // Only what this order still owes. A previous attempt may have applied
    // half of it before failing, and charging the whole invoice against the
    // cart again would take goods that were never paid for.
    const applied = { ...(invoice.applied ?? {}) };
    const owed = remainingPaidLines(draft.lines, applied);
    if (owed.length === 0) {
      clearCheckoutMark(context, invoice.draftOrderId);
      settled = true;
      continue;
    }

    const cart = await context.cart.get();
    const cartLines = (cart?.lines?.nodes ?? []).map((node) => ({
      id: node.id,
      variantId: node.merchandise?.id ?? "",
      quantity: node.quantity,
    }));
    const { updates, removals } = adjustmentForPaidLines(cartLines, owed);
    const note = (lines: LineAdjustment[]) => {
      for (const line of lines) {
        applied[line.variantId] = (applied[line.variantId] ?? 0) + line.taken;
      }
    };
    // A cart mutation reports a refusal in `userErrors` and `errors` and does
    // not always throw, so reading `cart` alone let a rejected mutation pass
    // for a settled one — the note was cleared, the goods stayed, and nothing
    // ever tried again.
    const refusal = (result: {
      cart?: unknown;
      errors?: unknown;
      userErrors?: unknown;
    }): string | null => {
      const errors = (result?.errors ?? []) as unknown[];
      const userErrors = (result?.userErrors ?? []) as unknown[];
      if (errors.length > 0 || userErrors.length > 0) {
        return JSON.stringify(errors.length > 0 ? errors : userErrors);
      }
      return result?.cart ? null : "no cart in mutation result";
    };

    let latest = cart;
    let failed = false;
    try {
      if (updates.length > 0) {
        const result = await context.cart.updateLines(
          updates.map(({ id, quantity }) => ({ id, quantity })),
        );
        const problem = refusal(result);
        if (problem) {
          console.warn("[B2Bridge] cart not settled, update refused:", problem);
          failed = true;
        } else {
          latest = result.cart;
          note(updates);
        }
      }
      if (!failed && removals.length > 0) {
        const result = await context.cart.removeLines(
          removals.map(({ id }) => id),
        );
        const problem = refusal(result);
        if (problem) {
          console.warn(
            "[B2Bridge] cart not settled, removal refused:",
            problem,
          );
          failed = true;
        } else {
          latest = result.cart;
          note(removals);
        }
      }
    } catch (error) {
      console.warn("[B2Bridge] cart not settled:", (error as Error)?.message);
      failed = true;
    }

    if (latest?.id) {
      for (const [name, value] of context.cart.setCartId(latest.id)) {
        headers.set(name, value);
      }
    }

    if (failed) {
      recordSettlementProgress(context, invoice.draftOrderId, applied);
      // Stop here rather than move on: the next invoice is measured against
      // a cart this one has left half-adjusted.
      break;
    }

    clearCheckoutMark(context, invoice.draftOrderId);
    settled = true;
  }

  return data({ settled }, { headers });
}
