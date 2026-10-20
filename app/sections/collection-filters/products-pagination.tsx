import { FunnelXIcon, XIcon } from "@phosphor-icons/react";
import { Pagination } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import type {
  CollectionQuery,
  ProductCardFragment,
} from "storefront-api.generated";
import Link, { variants } from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { cn } from "~/utils/cn";
import {
  COMBINED_LISTINGS_CONFIGS,
  isCombinedListing,
} from "~/utils/combined-listings";
import { type AppliedFilter, getAppliedFilterLink } from "~/utils/filter";

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
  const [params] = useSearchParams();
  const location = useLocation();
  const { pathname } = location;
  const { ref, inView } = useInView();

  return (
    <div className="grow space-y-6">
      {appliedFilters.length > 0 ? (
        // One flat row: the design spaces the label, the chips and the clear
        // link by the same 10px, so the chips no longer sit in a group of
        // their own.
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-2 py-1 font-semibold text-body-subtle text-base tracking-[0.28px]">
            {t("collection.filteredBy")}
          </span>
          {appliedFilters.map((filter: AppliedFilter) => {
            const { label } = filter;
            return (
              <Link
                key={label}
                to={getAppliedFilterLink(filter, params, location)}
                className="items-center gap-2 rounded-xl border border-line-subtle px-2 py-1.5 text-body-subtle text-base leading-none tracking-[0.28px] hover:border-line"
                variant="custom"
                preventScrollReset
              >
                <span>{label}</span>
                <XIcon className="h-3.5 w-3.5" />
              </Link>
            );
          })}
          {appliedFilters.length > 1 ? (
            <Link
              to={pathname}
              variant="underline"
              // The rule under the link takes the chips' border colour rather than
              // the body colour the `underline` variant defaults to, so the row
              // reads as one set of controls.
              className="text-body-subtle text-base tracking-[0.28px] after:bg-line-subtle"
              aria-label={t("collection.clearAllLabel")}
              preventScrollReset
            >
              {t("collection.clearAll")}
            </Link>
          ) : null}
        </div>
      ) : null}
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
        "grid grid-cols-(--cols-mobile) lg:grid-cols-(--cols-desktop)",
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
