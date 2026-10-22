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
        pageInfo {
          hasNextPage
        }
      }
    }
  }
` as const;

/**
 * Draft orders for one customer, newest first.
 *
 * Asked before retrying a checkout whose reply was lost. The cart stores that
 * an attempt began, but only Shopify can say whether it became a draft order.
 */
export const openDraftOrdersQuery = `#graphql
  query B2BridgeOpenDraftOrders($query: String!, $after: String) {
    draftOrders(first: 10, after: $after, reverse: true, query: $query) {
      nodes {
        id
        invoiceUrl
        status
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
          pageInfo {
            hasNextPage
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;
