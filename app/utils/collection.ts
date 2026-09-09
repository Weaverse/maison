/**
 * Label for the number of products in a collection.
 *
 * The Storefront API has no count field on `Collection`, so both surfaces that
 * show a count query product ids capped at `COLLECTION_PRODUCT_COUNT_LIMIT` and
 * read `pageInfo.hasNextPage`. At the cap the label reads "N+" rather than
 * reporting a number that would be wrong.
 *
 * Takes the connection rather than the collection so the collections page and
 * the featured collections section, whose queries shape a collection
 * differently, can share one implementation and one threshold.
 */
export function getProductCountLabel(
  products?: {
    nodes: unknown[];
    pageInfo?: { hasNextPage: boolean };
  } | null,
) {
  if (!products) {
    return null;
  }

  const total = products.nodes.length;
  const suffix = products.pageInfo?.hasNextPage ? "+" : "";
  return `${total}${suffix} ${total === 1 && !suffix ? "product" : "products"}`;
}
