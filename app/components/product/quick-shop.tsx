import { HandbagSimpleIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Await, useFetcher, useRouteLoaderData } from "react-router";
import type { ProductQuery } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import { ProductMedia } from "~/components/product/product-media";
import type { RootLoader } from "~/root";
import { Subtotal } from "~/sections/variant-list/subtotal";
import { VariantRow } from "~/sections/variant-list/variant-row";

interface QuickViewData {
  product: NonNullable<ProductQuery["product"]>;
  storeDomain: string;
}

export function QuickShop({
  data,
}: {
  data: QuickViewData;
  panelType?: "modal" | "drawer";
}) {
  const { bundleBadgeColor } = useThemeSettings();
  const { product } = data || {};
  const rootData = useRouteLoaderData<RootLoader>("root");

  const variants = product?.variants?.nodes || [];
  const firstImage = product?.media?.nodes?.[0];
  const sellingPlanGroups = product?.sellingPlanGroups || { nodes: [] };

  const priceRange = product?.priceRange;
  const minPrice = priceRange?.minVariantPrice?.amount;
  const maxPrice = priceRange?.maxVariantPrice?.amount;
  const currencyCode = priceRange?.minVariantPrice?.currencyCode || "USD";

  const formatPrice = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(Number.parseFloat(amount));
  };

  return (
    <div className="bg-background p-6 md:p-10">
      <div className="mb-6 flex flex-col gap-8 md:flex-row md:gap-12">
        <div className="mt-4 md:mt-0 aspect-square w-full md:w-[200px] flex-shrink-0 overflow-hidden rounded bg-gray-100">
          {firstImage && (
            <ProductMedia
              mediaLayout="slider"
              media={[firstImage]}
              selectedVariant={variants[0]}
              showThumbnails={false}
            />
          )}
        </div>
        <div className="flex flex-col gap-3 justify-between max-h-full">
          <div className="space-y-2.5">
            <h3 className="text-3xl font-normal leading-tight">
              {product.title}
            </h3>
            <div className="flex items-center gap-2 text-body-subtle">
              <span className="text-sm">From</span>
              <span>
                {minPrice === maxPrice
                  ? formatPrice(minPrice)
                  : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: bundleBadgeColor }}
              />
              <span className="text-xs text-body-subtle">In Stock</span>
            </div>
          </div>
          <Link
            to={`/products/${product.handle}`}
            prefetch="intent"
            variant="underline"
            className="w-fit text-sm text-body-subtle"
          >
            View full details
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          {/* mobile header */}
          <div className="border-b border-line-subtle py-3 md:hidden">
            <div className="text-sm font-semibold uppercase text-body-subtle">
              Products
            </div>
          </div>
          {/* tablet/desktop header */}
          {sellingPlanGroups?.nodes?.length > 0 ? (
            <div className="hidden md:grid grid-cols-[1fr_280px_270px_160px_153px] gap-6 border-b border-line-subtle py-3 text-body-subtle">
              <div className="text-sm font-semibold uppercase">Variant</div>
              <div className="text-sm font-semibold uppercase text-center">
                Purchase Method
              </div>
              <div className="text-sm font-semibold uppercase text-center">
                Quantity
              </div>
              <div className="text-sm font-semibold uppercase text-center">
                Price
              </div>
              <div className="text-sm font-semibold uppercase text-right">
                Variant Price
              </div>
            </div>
          ) : (
            <div className="hidden md:grid grid-cols-[1fr_270px_160px_153px] gap-6 border-b border-line-subtle py-3 text-body-subtle">
              <div className="text-sm font-semibold uppercase">Variant</div>
              <div className="text-sm font-semibold uppercase text-center">
                Quantity
              </div>
              <div className="text-sm font-semibold uppercase text-center">
                Price
              </div>
              <div className="text-sm font-semibold uppercase text-right">
                Variant Price
              </div>
            </div>
          )}
          <Await resolve={rootData?.cart}>
            {(resolvedCart) => (
              <>
                <div className="space-y-10 md:space-y-6">
                  {variants.map((variant) => (
                    <VariantRow
                      key={variant.id}
                      variant={variant}
                      cart={resolvedCart}
                      sellingPlanGroups={sellingPlanGroups}
                    />
                  ))}
                </div>
                <div className="sticky bottom-0 bg-background pb-6 px-6 md:pb-10 md:px-10 -mx-6 md:-mx-10 -mb-6 md:-mb-10">
                  <Subtotal cart={resolvedCart} variants={variants} />
                </div>
              </>
            )}
          </Await>
        </div>
      </div>
    </div>
  );
}

export function QuickShopTrigger({
  productHandle,
  showOnHover = true,
  buttonType = "icon",
  buttonText = "Quick shop",
  placement = "image",
}: {
  productHandle: string;
  showOnHover?: boolean;
  buttonType?: "icon" | "text";
  buttonText?: string;
  placement?: "image" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const { load, data, state } = useFetcher<{
    product: ProductQuery["product"];
  }>();

  const [isFetching, setIsFetching] = useState(false);
  const isLoading = state === "loading" || isFetching;

  useEffect(() => {
    if (isFetching && data?.product) {
      setIsFetching(false);
      setOpen(true);
    }
  }, [data, isFetching]);

  const handleOpen = () => {
    if (data?.product) {
      setOpen(true);
    } else {
      setIsFetching(true);
      load(`/api/product/${productHandle}`);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Button
        animate={false}
        variant={placement === "image" ? "secondary" : "outline"}
        onClick={handleOpen}
        loading={isLoading}
        className={clsx(
          "group/quick-shop h-10.5 p-3 leading-4",
          placement === "image" && [
            "absolute bottom-4",
            buttonType === "icon"
              ? "right-4 rounded-full shadow-xl"
              : "inset-x-4 shadow-xs",
            showOnHover &&
              "opacity-0 transition-opacity group-hover:opacity-100",
          ],
          placement === "bottom" && ["w-full shadow-xs"],
        )}
      >
        {buttonType === "icon" && placement === "image" ? (
          <>
            <HandbagSimpleIcon size={16} className="h-4 w-4" />
            <span className="w-0 overflow-hidden pl-0 text-base transition-all group-hover/quick-shop:w-9.5 group-hover/quick-shop:pl-2">
              Add
            </span>
          </>
        ) : (
          <span className="px-2">{buttonText}</span>
        )}
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-gray-900/50 [--fade-in-duration:150ms] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content
          className={clsx(
            "quick-shop-dialog-content",
            "fixed inset-0 z-10 flex items-center overflow-x-hidden px-4",
            "backdrop-blur-xs data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down",
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains("quick-shop-dialog-content")) {
              setOpen(false);
            }
          }}
          style={
            {
              "--slide-up-from": "20px",
              "--slide-up-duration": "300ms",
              "--slide-down-to": "20px",
            } as React.CSSProperties
          }
          aria-describedby={undefined}
        >
          <Dialog.Close asChild>
            <Button
              className="absolute top-3 right-3 rounded-full p-2"
              variant="secondary"
            >
              <XIcon size={18} />
            </Button>
          </Dialog.Close>
          <div
            style={{ maxHeight: "90vh" }}
            className={clsx(
              "relative mx-auto h-auto w-full overflow-y-auto",
              "animate-slide-up bg-white shadow-sm rounded-[4px]",
              "max-w-7xl",
            )}
          >
            <VisuallyHidden.Root asChild>
              <Dialog.Title>Quick shop modal</Dialog.Title>
            </VisuallyHidden.Root>
            {data?.product && <QuickShop data={data as QuickViewData} />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
