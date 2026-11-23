import { FunnelXIcon } from "@phosphor-icons/react";
import { Pagination } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useLoaderData, useNavigate } from "react-router";
import type {
  CollectionQuery,
  ProductCardFragment,
} from "storefront-api.generated";
import { variants } from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { cn } from "~/utils/cn";
import {
  COMBINED_LISTINGS_CONFIGS,
  isCombinedListing,
} from "~/utils/combined-listings";
import type { AppliedFilter } from "~/utils/filter";
import { AppliedFilters } from "./applied-filters";

export function ProductsPagination({
  gridSizeDesktop: desktopCols = 3,
  gridSizeMobile: mobileCols = 1,
  loadPrevText,
  loadMoreText,
}: {
  gridSizeDesktop: number;
  gridSizeMobile: number;
  loadPrevText: string;
  loadMoreText: string;
}) {
  const { t } = useTranslation();
  const { collection, appliedFilters } = useLoaderData<
    CollectionQuery & {
      collections: Array<{ handle: string; title: string }>;
      appliedFilters: AppliedFilter[];
    }
  >();
  const { ref, inView } = useInView();

  return (
    <div className="grow space-y-6">
      <AppliedFilters filters={appliedFilters} />
      {collection.products.nodes.length > 0 ? (
        <Pagination connection={collection.products}>
          {({
            nodes,
            isLoading,
            nextPageUrl,
            hasNextPage,
            hasPreviousPage,
            PreviousLink,
            NextLink,
            state,
          }) => (
            <div
              className="flex w-full flex-col items-center gap-8"
              style={
                {
                  "--cols-mobile": `repeat(${mobileCols}, minmax(0, 1fr))`,
                  "--cols-desktop": `repeat(${desktopCols}, minmax(0, 1fr))`,
                } as React.CSSProperties
              }
            >
              {hasPreviousPage && (
                <PreviousLink
                  className={cn("mx-auto", variants({ variant: "outline" }))}
                >
                  {isLoading ? "Loading..." : loadPrevText}
                </PreviousLink>
              )}
              <ProductsLoadedOnScroll
                nodes={nodes}
                inView={inView}
                nextPageUrl={nextPageUrl}
                hasNextPage={hasNextPage}
                state={state}
              />
              {hasNextPage && (
                <NextLink
                  className={cn("mx-auto", variants({ variant: "outline" }))}
                >
                  {isLoading ? "Loading..." : loadMoreText}
                </NextLink>
              )}
            </div>
          )}
        </Pagination>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 pt-20">
          <FunnelXIcon size={50} weight="light" />
          <div className="text-lg">{t("collection.noProductsMatched")}</div>
        </div>
      )}
    </div>
  );
}

interface ProductsLoadedOnScrollProps {
  nodes: any;
  inView: boolean;
  nextPageUrl: string;
  hasNextPage: boolean;
  state: any;
}

function ProductsLoadedOnScroll(props: ProductsLoadedOnScrollProps) {
  const { nodes, inView, nextPageUrl, hasNextPage, state } = props;
  const navigate = useNavigate();

  useEffect(() => {
    if (inView && hasNextPage) {
      navigate(nextPageUrl, {
        replace: true,
        preventScrollReset: true,
        state,
      });
    }
  }, [inView, navigate, state, nextPageUrl, hasNextPage]);

  return (
    <div
      className={clsx([
        "w-full gap-x-4 gap-y-6 lg:gap-y-10",
        // The merchant sets the two ends, phone and desktop. Jumping straight
        // from one to the other at `lg` left everything from 512px to 1023px
        // on the phone count — a single card stretched across the width of a
        // tablet. The count climbs with the theme's own breakpoints instead.
        "grid grid-cols-(--cols-mobile) sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-(--cols-desktop)",
      ])}
    >
      {nodes
        .filter(
          (product: ProductCardFragment) =>
            !(
              COMBINED_LISTINGS_CONFIGS.hideCombinedListingsFromProductList &&
              isCombinedListing(product)
            ),
        )
        .map((product: ProductCardFragment) => (
          <ProductCard key={product.id} product={product} />
        ))}
    </div>
  );
}
