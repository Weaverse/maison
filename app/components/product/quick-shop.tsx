import { HandbagSimpleIcon, ImageIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Await, useFetcher, useRouteLoaderData } from "react-router";
import type { ProductQuery } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import { ProductMedia } from "~/components/product/product-media";
import { Skeleton } from "~/components/skeleton";
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
  const { product } = data || {};
  const rootData = useRouteLoaderData<RootLoader>("root");

  const variants = product?.variants?.nodes || [];
  const firstImage = product?.media?.nodes?.[0];

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
    <div className="bg-background p-6">
      <div className="mb-6 flex gap-6">
        <div className="h-60 w-60 flex-shrink-0 overflow-hidden rounded bg-gray-100">
          {firstImage && (
            <ProductMedia
              mediaLayout="slider"
              media={[firstImage]}
              selectedVariant={variants[0]}
              showThumbnails={false}
            />
          )}
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-2xl font-normal">{product.title}</h3>
          <div className="flex items-center gap-3">
            <span className="text-body-subtle">From</span>
            <span className="text-xl">
              {minPrice === maxPrice
                ? formatPrice(minPrice)
                : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-body-subtle">In Stock</span>
          </div>
          <Link
            to={`/products/${product.handle}`}
            prefetch="intent"
            variant="underline"
            className="w-fit text-sm"
          >
            View full details
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 border-b border-line-subtle pb-3">
            <div className="text-sm font-bold uppercase">Variant</div>
            <div className="text-center text-sm font-bold uppercase">
              Quantity
            </div>
            <div className="text-center text-sm font-bold uppercase">Price</div>
            <div className="text-right text-sm font-bold uppercase">
              Variant Price
            </div>
          </div>
          <div className="space-y-6">
            {variants.map((variant) => (
              <VariantRow key={variant.id} variant={variant} />
            ))}
          </div>
        </div>

        <Await resolve={rootData?.cart}>
          {(resolvedCart) => (
            <Subtotal cart={resolvedCart} variants={variants} />
          )}
        </Await>
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
  const { load, data } = useFetcher<{ product: ProductQuery["product"] }>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: open and state are intentionally excluded
  useEffect(() => {
    if (open && !data) {
      load(`/api/product/${productHandle}`);
    }
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          animate={false}
          variant={placement === "image" ? "secondary" : "outline"}
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
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-gray-900/50 [--fade-in-duration:150ms] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={clsx(
            "quick-shop-dialog-content",
            "fixed inset-0 z-10 flex items-center overflow-x-hidden px-4",
            "backdrop-blur-xs data-[state=open]:animate-slide-up",
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
              "animate-slide-up bg-white shadow-sm",
              "max-w-7xl",
            )}
          >
            <VisuallyHidden.Root asChild>
              <Dialog.Title>Quick shop modal</Dialog.Title>
            </VisuallyHidden.Root>
            {data?.product ? (
              <QuickShop data={data as QuickViewData} />
            ) : (
              <div className="p-6">
                <div className="mb-6 flex gap-6">
                  <Skeleton className="flex h-60 w-60 flex-shrink-0 items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-body-subtle" />
                  </Skeleton>
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="mb-4">
                  <Skeleton className="mb-3 h-10 w-full" />
                  <Skeleton className="mb-4 h-24 w-full" />
                  <Skeleton className="mb-4 h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                  <Skeleton className="h-16 w-48" />
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
