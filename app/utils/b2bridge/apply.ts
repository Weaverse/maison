import type { VariantOverlay } from "./types";

/**
 * Applies B2Bridge overlays onto a Shopify product returned by `PRODUCT_QUERY`.
 *
 * Nothing in Maison passes prices as props — every section re-reads the route
 * loader and takes `variant.price` straight off the Shopify object
 * (`app/components/product/variant-prices.tsx:35`,
 * `app/sections/variant-list/variant-row.tsx:548`). So the only place a
 * different price can enter is the loader, by rewriting those objects before
 * they are returned.
 */

/** `gid://shopify/ProductVariant/47591719436510` → `47591719436510`. */
export function variantIdFromGid(gid: string): string | null {
  const match = /\/ProductVariant\/(\d+)/.exec(gid);
  return match ? match[1] : null;
}

type MaybeVariant = {
  id?: unknown;
  price?: { amount?: unknown; currencyCode?: unknown };
  quantityPriceBreaks?: unknown;
  quantityRule?: unknown;
};

function isVariantNode(value: unknown): value is MaybeVariant {
  if (!value || typeof value !== "object") {
    return false;
  }
  const node = value as MaybeVariant;
  return (
    typeof node.id === "string" &&
    node.id.includes("/ProductVariant/") &&
    typeof node.price === "object" &&
    node.price !== null
  );
}

/**
 * Rewrites every variant in the product graph that the overlays cover.
 *
 * `PRODUCT_QUERY` returns the same variant through five different paths —
 * `selectedOrFirstAvailableVariant`, `adjacentVariants`, `variants.nodes`,
 * `options[].optionValues[].firstSelectableVariant` and `isBundle.components` —
 * and a price left un-overlaid on any one of them would show the retail number
 * somewhere on the page. Rather than enumerate those paths and break the next
 * time the query grows, this walks the object and rewrites anything that looks
 * like a product variant.
 *
 * Mutates in place: the product object is a fresh GraphQL response owned by
 * this request, and cloning 250 variants per page load would be wasted work.
 *
 * Returns how many variant nodes were rewritten, which the caller logs.
 */
export function applyOverlays(
  product: unknown,
  overlays: Map<string, VariantOverlay>,
): number {
  if (overlays.size === 0) {
    return 0;
  }

  const seen = new WeakSet<object>();
  let applied = 0;

  function walk(value: unknown): void {
    if (!value || typeof value !== "object") {
      return;
    }
    if (seen.has(value)) {
      return;
    }
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    if (isVariantNode(value)) {
      const numericId = variantIdFromGid(value.id as string);
      const overlay = numericId ? overlays.get(numericId) : undefined;
      if (overlay) {
        const node = value as Record<string, unknown>;
        // The currency always comes from the Shopify variant being replaced,
        // never from the overlay: B2Bridge returns bare numbers with no
        // currency at all, so the only trustworthy source is the money object
        // Shopify already resolved for this market. Reading it here also means
        // the overlay cannot disagree with the price it is replacing.
        const currencyCode =
          (value.price?.currencyCode as string) ?? overlay.price.currencyCode;
        node.price = { amount: overlay.price.amount, currencyCode };
        node.quantityPriceBreaks = {
          nodes: overlay.quantityPriceBreaks.nodes.map((tier) => ({
            minimumQuantity: tier.minimumQuantity,
            price: { amount: tier.price.amount, currencyCode },
          })),
        };
        if (overlay.quantityRule) {
          node.quantityRule = { ...overlay.quantityRule };
        }
        applied += 1;
      }
    }

    for (const child of Object.values(value as Record<string, unknown>)) {
      walk(child);
    }
  }

  walk(product);
  return applied;
}
