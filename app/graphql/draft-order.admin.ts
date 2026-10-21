/**
 * Admin API documents for reading draft orders.
 *
 * Lives here, under the `*.admin.ts` name, because codegen validates every
 * `#graphql` document against the Storefront or Customer Account schema and
 * `draftOrder` exists in neither. `codegen.ts` excludes this glob from both
 * projects, the same way `customer.admin.ts` is excluded.
 *
 * Deliberately does not ask for the `order` the draft became: that field needs
 * the `read_orders` scope, while `status` and `lineItems` need only
 * `read_draft_orders`, and `COMPLETED` already answers the question.
 */
export const draftOrderQuery = `#graphql
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
` as const;

/**
 * Open draft orders for one customer, newest first.
 *
 * Asked before a new one is created. A checkout whose reply was lost may
 * already have made a draft order, and nothing the storefront stores can say
 * so — the record of the attempt rides on the reply that went missing. Shopify
 * is the one party that knows either way, so it gets asked rather than
 * guessed at.
 */
export const openDraftOrdersQuery = `#graphql
  query B2BridgeOpenDraftOrders($query: String!) {
    draftOrders(first: 10, reverse: true, query: $query) {
      nodes {
        id
        invoiceUrl
        createdAt
        subtotalPrice
        currencyCode
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
  }
` as const;
