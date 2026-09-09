/**
 * Column templates for the variant table.
 *
 * The same three shapes are rendered in four places — the section header and
 * rows in `variant-list-items.tsx` and `variant-row.tsx`, the footer in
 * `subtotal.tsx`, and the quick shop panel in
 * `~/components/product/quick-shop.tsx`. A header and its rows are separate
 * grids, so a column change has to reach every one of them at once; keeping the
 * templates here is what makes that a single edit.
 *
 * The tracks are written as literal class strings rather than built at runtime
 * so Tailwind's scanner still finds them.
 */

/**
 * Tablet: variant, price, variant price. The design draws a fourth QUANTITY
 * column with its label at opacity 0 and spans the row's variant cell across
 * it, which places Price and Variant Price identically either way.
 */
export const VARIANT_GRID_TABLET = "grid-cols-[1fr_150px_160px]";

/** Desktop, product with selling plans: adds a purchase method column. */
export const VARIANT_GRID_DESKTOP = "grid-cols-[1fr_230px_280px_200px_153px]";

/** Desktop, product without selling plans. */
export const VARIANT_GRID_DESKTOP_COMPACT = "grid-cols-[1fr_280px_200px_153px]";

/** Pick the desktop template for a product, by whether it offers selling plans. */
export function desktopVariantGrid(hasPurchaseMethod: boolean) {
  return hasPurchaseMethod
    ? VARIANT_GRID_DESKTOP
    : VARIANT_GRID_DESKTOP_COMPACT;
}
