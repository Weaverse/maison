import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import {
  CHECKOUT_PENDING_MS,
  clearCheckoutMark,
  clearSettlementPlan,
  planFromCart,
  readCheckoutMarks,
  saveSettlementPlan,
} from "~/utils/b2bridge/cart.server";
import { withCartMutationLock } from "~/utils/b2bridge/cart-state.server";
import { readDraftOrder } from "~/utils/b2bridge/draft-order.server";
import {
  planForPaidLines,
  planSteps,
  planStillApplies,
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

  try {
    async function settleCart() {
      return settleUnlocked(context);
    }
    return await withCartMutationLock(context, settleCart);
  } catch (error) {
    // A failed attribute write must leave the invoice pending, never be
    // reported as settled. A later cart visit can retry the recorded plan.
    console.warn("[B2Bridge] cart settlement state could not be saved:", error);
    return data({ settled: false }, { status: 503 });
  }
}

async function settleUnlocked(context: ActionFunctionArgs["context"]) {
  const pending = await readCheckoutMarks(context);
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
      await clearCheckoutMark(context, invoice.draftOrderId);
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
      await clearCheckoutMark(context, invoice.draftOrderId);
      continue;
    }
    if (draft.status !== "COMPLETED") {
      continue;
    }

    const cart = await context.cart.get();
    const cartLines = (cart?.lines?.nodes ?? []).map((node) => ({
      id: node.id,
      variantId: node.merchandise?.id ?? "",
      quantity: node.quantity,
    }));

    // The plan is written down before any of it is done, and says where each
    // line ends up rather than how much to take off it. Applying it twice
    // leaves the same cart as applying it once, so a reply that was lost and
    // two requests racing each other both stop being dangerous.
    let plan = planFromCart(cart, invoice.draftOrderId);
    if (plan && !planStillApplies(plan, cartLines)) {
      // The buyer has changed one of these lines since. Their edit wins;
      // what is still owed is worked out again from the cart as it stands.
      plan = null;
    }
    if (!plan) {
      plan = planForPaidLines(invoice.draftOrderId, cartLines, draft.lines);
      await saveSettlementPlan(context, plan);
    }

    const { updates, removals } = planSteps(plan, cartLines);
    if (updates.length === 0 && removals.length === 0) {
      // Every line is already where the plan puts it, however it got there.
      await clearCheckoutMark(context, invoice.draftOrderId);
      await clearSettlementPlan(context, invoice.draftOrderId);
      settled = true;
      continue;
    }

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
        const result = await context.cart.updateLines(updates);
        const problem = refusal(result);
        if (problem) {
          console.warn("[B2Bridge] cart not settled, update refused:", problem);
          failed = true;
        } else {
          latest = result.cart;
        }
      }
      if (!failed && removals.length > 0) {
        const result = await context.cart.removeLines(removals);
        const problem = refusal(result);
        if (problem) {
          console.warn(
            "[B2Bridge] cart not settled, removal refused:",
            problem,
          );
          failed = true;
        } else {
          latest = result.cart;
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
      // The plan stays on the cart, so the next attempt picks up exactly
      // where this one stopped. Stop here rather than move on: the next
      // invoice is measured against a cart this one has left half-adjusted.
      break;
    }

    await clearCheckoutMark(context, invoice.draftOrderId);
    await clearSettlementPlan(context, invoice.draftOrderId);
    settled = true;
  }

  return data({ settled }, { headers });
}
