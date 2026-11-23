import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
import type { Location, useLocation } from "react-router";

export const FILTER_URL_PREFIX = "filter.";

export type AppliedFilter = {
  label: string;
  filter: ProductFilter;
};

export type SortParam =
  | "price-low-high"
  | "price-high-low"
  | "best-selling"
  | "newest"
  | "featured"
  | "relevance";

/**
 * Whether two filters mean the same thing, whichever way each was serialised.
 *
 * Shopify writes `/` as `\/` inside a filter value's `input`, so the string it
 * hands back is not the one `JSON.stringify` produces from the same object.
 * Nothing noticed while every filter was a plain string or boolean; colour
 * swatches carry a taxonomy id — `gid://shopify/TaxonomyValue/6` — and so
 * never matched, which left a colour impossible to switch back off.
 */
export function isSameFilter(
  a: ProductFilter | string,
  b: ProductFilter | string,
) {
  const canonical = (filter: ProductFilter | string) =>
    JSON.stringify(typeof filter === "string" ? JSON.parse(filter) : filter);
  return canonical(a) === canonical(b);
}

export function clearPaginationParams(params: URLSearchParams) {
  params.delete("cursor");
  params.delete("direction");
  return params;
}

export function getAppliedFilterLink(
  { filter }: AppliedFilter,
  params: URLSearchParams,
  location: Location,
) {
  const paramsClone = new URLSearchParams(params);
  for (const [k, v] of Object.entries(filter)) {
    paramsClone.delete(FILTER_URL_PREFIX + k, JSON.stringify(v));
  }
  clearPaginationParams(paramsClone);
  return `${location.pathname}?${paramsClone.toString()}`;
}

export function countFilterParams(params: URLSearchParams) {
  let count = 0;
  for (const key of params.keys()) {
    if (key.startsWith(FILTER_URL_PREFIX)) {
      count += 1;
    }
  }
  return count;
}

/**
 * Drops every filter and nothing else. Pointing "Clear all" at the bare
 * pathname also threw away the search term, so clearing a colour on the search
 * page emptied the search box with it; the sort order went the same way.
 */
export function getClearFiltersLink(
  params: URLSearchParams,
  location: Location,
) {
  const paramsClone = new URLSearchParams(params);
  for (const key of [...paramsClone.keys()]) {
    if (key.startsWith(FILTER_URL_PREFIX)) {
      paramsClone.delete(key);
    }
  }
  clearPaginationParams(paramsClone);
  const query = paramsClone.toString();
  return query ? `${location.pathname}?${query}` : location.pathname;
}

export function getFilterLink(
  input: string | ProductFilter,
  params: URLSearchParams,
  location: ReturnType<typeof useLocation>,
) {
  const paramsClone = new URLSearchParams(params);
  const newParams = filterInputToParams(input, paramsClone);
  clearPaginationParams(newParams);
  return `${location.pathname}?${newParams.toString()}`;
}

export function filterInputToParams(
  input: string | ProductFilter,
  params: URLSearchParams,
) {
  const filter =
    typeof input === "string" ? (JSON.parse(input) as ProductFilter) : input;

  for (const [k, v] of Object.entries(filter)) {
    const key = `${FILTER_URL_PREFIX}${k}`;
    const value = JSON.stringify(v);
    if (params.has(key, value)) {
      return params;
    }
    if (k === "price") {
      // For price, we want to overwrite
      params.set(key, value);
    } else {
      params.append(key, value);
    }
  }

  return params;
}
