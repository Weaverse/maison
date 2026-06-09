import {
  CaretRightIcon,
  MagnifyingGlassIcon,
  SlidersIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Accordion from "@radix-ui/react-accordion";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Analytics,
  getPaginationVariables,
  getSeoMeta,
  Pagination,
} from "@shopify/hydrogen";
import type {
  Filter,
  ProductFilter,
  SearchSortKeys,
} from "@shopify/hydrogen/storefront-api-types";
import type { LoaderFunctionArgs, MetaArgs } from "@shopify/remix-oxygen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { clsx } from "clsx";
import { Fragment, Suspense, useEffect, useState } from "react";
import { Await, Form, useLoaderData } from "react-router";
import type { SearchQuery } from "storefront-api.generated";
import { Button } from "~/components/button";
import Link, { variants } from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { OPTIONS_AS_SWATCH } from "~/components/product/product-option-values";
import { ScrollArea } from "~/components/scroll-area";
import { Section } from "~/components/section";
import { Swimlane } from "~/components/swimlane";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { FilterItem } from "~/sections/collection-filters/filter-item";
import { PriceRangeFilter } from "~/sections/collection-filters/price-range-filter";
import { Sort } from "~/sections/collection-filters/sort";
import type { I18nLocale } from "~/types/locale";
import { cn } from "~/utils/cn";
import { PAGINATION_SIZE } from "~/utils/const";
import {
  type AppliedFilter,
  FILTER_URL_PREFIX,
  type SortParam,
} from "~/utils/filter";
import { seoPayload } from "~/utils/seo.server";
import {
  type FeaturedData,
  getFeaturedData,
} from "./($locale).api.featured-items";

export async function loader({
  request,
  context: { storefront, customerAccount },
}: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get("q");
  const { sortKey, reverse } = getSortValuesFromParam(
    searchParams.get("sort") as SortParam,
  );
  const filters = [...searchParams.entries()].reduce((flt, [key, value]) => {
    if (key.startsWith(FILTER_URL_PREFIX)) {
      const filterKey = key.substring(FILTER_URL_PREFIX.length);
      flt.push({
        [filterKey]: JSON.parse(value),
      });
    }
    return flt;
  }, [] as ProductFilter[]);

  let products: SearchQuery["search"] = {
    nodes: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
    productFilters: [],
    totalCount: 0,
  };
  let lowestPriceProduct: SearchQuery["lowestPriceProduct"] | null = null;
  let highestPriceProduct: SearchQuery["highestPriceProduct"] | null = null;

  if (searchTerm) {
    const variables = getPaginationVariables(request, {
      pageBy: PAGINATION_SIZE,
    });

    const buyer = await customerAccount.getBuyer();
    const buyerVariables =
      buyer?.companyLocationId && buyer?.customerAccessToken
        ? {
            buyer,
          }
        : {};

    const data = await storefront.query<SearchQuery>(SEARCH_QUERY, {
      variables: {
        searchTerm,
        ...variables,
        ...buyerVariables,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        filters,
        sortKey,
        reverse,
      },
    });
    products = data.search;
    lowestPriceProduct = data.lowestPriceProduct;
    highestPriceProduct = data.highestPriceProduct;
  }

  const hasResults = products?.nodes?.length > 0;
  let seoDescription = "";
  if (hasResults) {
    seoDescription = `Showing ${products.totalCount} search results for "${searchTerm}"`;
  } else if (searchTerm) {
    seoDescription = `No results found for "${searchTerm}"`;
  } else {
    seoDescription = "Search our store";
  }

  const allFilterValues = products.productFilters.flatMap(
    (filter) => filter.values,
  );

  const appliedFilters = filters
    .map((filter) => {
      const foundValue = allFilterValues.find((value) => {
        const valueInput = JSON.parse(value.input as string) as ProductFilter;
        if (valueInput.price && filter.price) {
          return true;
        }
        return JSON.stringify(valueInput) === JSON.stringify(filter);
      });
      if (!foundValue) {
        return null;
      }

      if (foundValue.id === "filter.v.price") {
        const input = JSON.parse(foundValue.input as string) as ProductFilter;
        const min = parseAsCurrency(input.price?.min ?? 0, storefront.i18n);
        const max = input.price?.max
          ? parseAsCurrency(input.price.max, storefront.i18n)
          : "";
        const label = min && max ? `${min} - ${max}` : "Price";

        return {
          filter,
          label,
        };
      }
      return {
        filter,
        label: foundValue.label,
      };
    })
    .filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  return {
    seo: seoPayload.collection({
      url: request.url,
      collection: {
        id: "search",
        title: "Search",
        handle: "search",
        descriptionHtml: "Search results",
        description: "Search results",
        seo: { title: "Search", description: seoDescription },
        metafields: [],
        products,
        updatedAt: new Date().toISOString(),
      },
    }),
    searchTerm,
    products,
    appliedFilters,
    lowestPriceProduct,
    highestPriceProduct,
    recommendations: hasResults
      ? Promise.resolve(null)
      : getRecommendations(storefront),
  };
}

export const meta = ({ matches }: MetaArgs<typeof loader>) => {
  return getSeoMeta(
    ...matches.map((match) => (match.data as any)?.seo).filter(Boolean),
  );
};

export default function Search() {
  const { searchTerm, products, recommendations } =
    useLoaderData<typeof loader>();
  const [searchKey, setSearchKey] = useState(searchTerm);
  const hasResults = products?.nodes?.length > 0;

  useEffect(() => {
    setSearchKey(searchTerm);
  }, [searchTerm]);

  return (
    <Section width="fixed" verticalPadding="medium">
      {/* <BreadCrumb className="justify-center" page="Search" /> */}
      <h4 className="mt-4 mb-2.5 text-center font-normal">
        {hasResults
          ? `${products.totalCount} results for “${searchTerm}”`
          : "Search"}
      </h4>
      <Form
        method="get"
        className="mx-auto mt-6 mb-4 flex w-[700px] max-w-[90vw] items-center gap-3 border border-line px-3 rounded-lg"
      >
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-gray-500" />
        <input
          className="h-full w-full py-4 focus-visible:outline-hidden"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          name="q"
          placeholder="Search our store..."
          type="search"
        />
        <button
          type="button"
          className="shrink-0 p-1 text-gray-500"
          onClick={() => setSearchKey("")}
        >
          <XIcon className="h-5 w-5" />
        </button>
      </Form>
      <PopularKeywords />

      {hasResults && (
        <div className="mb-8">
          <SearchFilterToolbar />
        </div>
      )}

      {hasResults ? (
        <Pagination connection={products}>
          {({
            nodes,
            isLoading,
            hasNextPage,
            hasPreviousPage,
            NextLink,
            PreviousLink,
          }) => {
            return (
              <div className="flex w-full flex-col items-center gap-6">
                {hasPreviousPage && (
                  <PreviousLink
                    className={cn("mx-auto", variants({ variant: "outline" }))}
                  >
                    {isLoading ? "Loading..." : "↑ Load previous"}
                  </PreviousLink>
                )}
                <div
                  className={clsx([
                    "w-full gap-x-4 gap-y-6 lg:gap-y-10",
                    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                  ])}
                >
                  {nodes.map((product) => {
                    // Cast product to any because search results nodes can be anything, but we filtered for PRODUCT
                    return (
                      <ProductCard key={product.id} product={product as any} />
                    );
                  })}
                </div>
                {hasNextPage && (
                  <NextLink
                    className={cn("mx-auto", variants({ variant: "outline" }))}
                  >
                    {isLoading ? "Loading..." : "↓ Load more"}
                  </NextLink>
                )}
              </div>
            );
          }}
        </Pagination>
      ) : (
        <NoResults searchTerm={searchTerm} recommendations={recommendations} />
      )}
      <Analytics.SearchView
        data={{ searchTerm: searchTerm || "", searchResults: products }}
      />
    </Section>
  );
}

function SearchFilterToolbar() {
  return (
    <div className="flex items-center justify-between gap-4">
      <Sort />
      <SearchFiltersDrawer />
    </div>
  );
}

function SearchFiltersDrawer() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className="flex h-12 items-center gap-1.5 border py-2"
          animate={false}
        >
          <SlidersIcon size={18} />
          <span>Filter</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-10 bg-black/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
          style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 z-10 w-full bg-(--color-background) md:w-[360px]",
            "right-0 data-[state=open]:animate-enter-from-right data-[state=closed]:animate-exit-to-right",
            "flex flex-col",
          ])}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <Dialog.Title asChild className="py-2.5 font-bold">
              <span>Filters</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="translate-x-2 p-2"
                aria-label="Close filters drawer"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <ScrollArea className="flex-1" size="sm">
            <SearchFilters className="px-4" />
          </ScrollArea>
          <div className="border-line-subtle border-t px-4 py-4 md:hidden">
            <Dialog.Close asChild>
              <Button className="w-full" variant="primary">
                Apply Filters
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchFilters({ className }: { className?: string }) {
  const { products, appliedFilters, lowestPriceProduct, highestPriceProduct } =
    useLoaderData<typeof loader>();
  const filters = products.productFilters as Filter[];

  // Mock collection object for PriceRangeFilter
  const mockCollectionEntry = {
    lowestPriceProduct,
    highestPriceProduct,
  } as any;

  return (
    <Accordion.Root
      type="multiple"
      className={cn("divide-y divide-line-subtle pr-3", className)}
      defaultValue={filters.map((f) => f.id)}
    >
      {filters.map((filter: Filter) => {
        const asSwatch = OPTIONS_AS_SWATCH.includes(filter.label);
        const asButton = filter.label === "Size"; // Hardcoded default for now or pass as prop if needed

        return (
          <Accordion.Item
            key={filter.id}
            value={filter.id}
            className="w-full pt-7 pb-6"
          >
            <Accordion.Trigger className="flex w-full items-center justify-between data-[state=open]:[&>svg]:rotate-90">
              <span className="text-sm font-semibold">{filter.label}</span>
              <CaretRightIcon className="h-4 w-4 rotate-0 transition-transform" />
            </Accordion.Trigger>
            <Accordion.Content
              style={
                {
                  "--expand-to": "var(--radix-accordion-content-height)",
                  "--expand-duration": "0.15s",
                  "--collapse-from": "var(--radix-accordion-content-height)",
                  "--collapse-duration": "0.15s",
                } as React.CSSProperties
              }
              className={clsx([
                "overflow-hidden",
                "data-[state=closed]:animate-collapse",
                "data-[state=open]:animate-expand",
              ])}
            >
              <div
                className={clsx(
                  "flex pt-8",
                  asSwatch || asButton ? "flex-wrap gap-1.5" : "flex-col gap-5",
                )}
              >
                {filter.type === "PRICE_RANGE" ? (
                  <PriceRangeFilter collection={mockCollectionEntry} />
                ) : (
                  filter.values?.map((option) => (
                    <FilterItem
                      key={option.id}
                      displayAs={
                        asSwatch ? "swatch" : asButton ? "button" : "list-item"
                      }
                      appliedFilters={appliedFilters as AppliedFilter[]}
                      option={option}
                      showFiltersCount={true}
                    />
                  ))
                )}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}

function PopularKeywords() {
  const { popularSearchKeywords } = useThemeSettings();
  if (!popularSearchKeywords?.length) {
    return null;
  }
  const popularKeywords: string[] = popularSearchKeywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  return (
    <div className="flex items-center justify-center text-body-subtle mb-8">
      <span>Popular searches:</span>
      {popularKeywords.map((search, ind) => (
        <Fragment key={search}>
          <Link
            to={`/search?q=${search}`}
            className="ml-1 underline-offset-4 hover:underline"
          >
            {search}
          </Link>
          {ind < popularKeywords.length - 1 && <span className="mr-px">,</span>}
        </Fragment>
      ))}
    </div>
  );
}

function NoResults({
  searchTerm,
  recommendations,
}: {
  searchTerm: string;
  recommendations: Promise<null | FeaturedData>;
}) {
  return (
    <>
      {searchTerm && (
        <div className="my-10 lg:my-16 flex flex-col items-center justify-center text-xl">
          No results for "{searchTerm}", try a different search.
        </div>
      )}
      <Suspense>
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommendations}
        >
          {(data) => {
            if (!data) {
              return null;
            }
            const { featuredProducts } = data;
            return (
              <div className="space-y-6 pt-20">
                <h5>Trending Products</h5>
                <Swimlane>
                  {featuredProducts.nodes.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      className="w-80 snap-start"
                    />
                  ))}
                </Swimlane>
              </div>
            );
          }}
        </Await>
      </Suspense>
    </>
  );
}

function getRecommendations(
  storefront: LoaderFunctionArgs["context"]["storefront"],
) {
  return getFeaturedData(storefront, { pageBy: PAGINATION_SIZE });
}

// Aliases for price range query
const SEARCH_QUERY = `#graphql
  query search(
    $buyer: BuyerInput
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $searchTerm: String!
    $startCursor: String
    $filters: [ProductFilter!]
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) @inContext(buyer: $buyer, country: $country, language: $language) {
      search(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse,
        query: $searchTerm
        productFilters: $filters
        types: [PRODUCT]
      ) {
        productFilters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          ... on Product {
             ...ProductCard
          }
        }
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
        }
        totalCount
      }
      lowestPriceProduct: search(
        first: 1
        sortKey: PRICE
        reverse: false
        query: $searchTerm
        productFilters: $filters
        types: [PRODUCT]
      ) {
        nodes {
           ... on Product {
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
           }
        }
      }
      highestPriceProduct: search(
        first: 1
        sortKey: PRICE
        reverse: true
        query: $searchTerm
        productFilters: $filters
        types: [PRODUCT]
      ) {
         nodes {
           ... on Product {
              priceRange {
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
           }
        }
      }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

function getSortValuesFromParam(sortParam: SortParam | null): {
  sortKey: SearchSortKeys;
  reverse: boolean;
} {
  switch (sortParam) {
    case "price-high-low":
      return {
        sortKey: "PRICE",
        reverse: true,
      };
    case "price-low-high":
      return {
        sortKey: "PRICE",
        reverse: false,
      };
    case "best-selling":
      // SearchSortKeys usually doesn't have BEST_SELLING, fallback to RELEVANCE
      // Use RELEVANCE as fallback for now.
      return {
        sortKey: "RELEVANCE",
        reverse: false,
      };
    case "newest":
      // SearchSortKeys usually doesn't have CREATED_AT, fallback to RELEVANCE
      return {
        sortKey: "RELEVANCE",
        reverse: true,
      };
    case "featured":
      // MANUAL usually not in SearchSortKeys
      return {
        sortKey: "RELEVANCE",
        reverse: false,
      };
    default:
      return {
        sortKey: "RELEVANCE",
        reverse: false,
      };
  }
}

function parseAsCurrency(value: number, locale: I18nLocale) {
  return new Intl.NumberFormat(`${locale.language}-${locale.country}`, {
    style: "currency",
    currency: locale.currency,
  }).format(value);
}
