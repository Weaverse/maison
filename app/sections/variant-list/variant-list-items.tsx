import type {
  OptimisticCartLineInput,
  ShopifyAddToCartPayload,
  ShopifyPageViewPayload,
} from "@shopify/hydrogen";
import {
  AnalyticsEventName,
  CartForm,
  getClientBrowserParameters,
  sendShopifyAnalytics,
} from "@shopify/hydrogen";
import { useEffect, useMemo, useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { Await, useMatches, useRouteLoaderData } from "react-router";
import type {
  CartApiQueryFragment,
  ProductQuery,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Button } from "~/components/button";
import { toggleCartDrawer } from "~/components/layout/cart-drawer";
import type { RootLoader } from "~/root";
import { DEFAULT_LOCALE } from "~/utils/const";
import { VariantRow } from "./variant-row";
import { Subtotal } from "./subtotal";

type Product = NonNullable<ProductQuery["product"]>;

interface VariantListItemsProps {
  variants: ProductVariantFragment[];
  product: Product;
}

interface VariantQuantity {
  [variantId: string]: number;
}

export function VariantListItems({ variants }: VariantListItemsProps) {
  console.log("🚀 ~ VariantListItems ~ variants:", variants);
  const rootData = useRouteLoaderData<RootLoader>("root");
  const cart = rootData?.cart;
  let totalItems = 0;
  let subtotal = 30;
  // const totalItems = Object.values(quantities).reduce(
  //   (sum, qty) => sum + qty,
  //   0,
  // );

  // const subtotal = Object.entries(quantities).reduce(
  //   (sum, [variantId, qty]) => {
  //     const variant = variants.find((v) => v.id === variantId);
  //     if (variant?.price?.amount) {
  //       return sum + Number.parseFloat(variant.price.amount) * qty;
  //     }
  //     return sum;
  //   },
  //   0,
  // );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 border-b border-line-subtle pb-3">
          <div className="text-sm font-bold uppercase">Variant</div>
          <div className="text-sm font-bold uppercase text-center ">
            Quantity
          </div>
          <div className="text-sm font-bold uppercase text-center">Price</div>
          <div className="text-sm font-bold uppercase text-right ">
            Variant Price
          </div>
        </div>
        <div className="space-y-6">
          {variants.map((variant) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              enableAutoUpdate={true}
            />
          ))}
        </div>
      </div>

      <Await resolve={rootData.cart}>
        {(resolvedCart) => <Subtotal cart={resolvedCart} variants={variants} />}
      </Await>
    </div>
  );
}

function usePageAnalytics({ hasUserConsent }: { hasUserConsent: boolean }) {
  const matches = useMatches();

  return useMemo(() => {
    const data: Record<string, unknown> = {};
    for (const match of matches) {
      const eventData = match?.data as Record<string, unknown>;
      if (eventData) {
        eventData.analytics && Object.assign(data, eventData.analytics);
        const selectedLocale =
          (eventData.selectedLocale as typeof DEFAULT_LOCALE) || DEFAULT_LOCALE;
        Object.assign(data, {
          currency: selectedLocale.currency,
          acceptedLanguage: selectedLocale.language,
        });
      }
    }

    return {
      ...data,
      hasUserConsent,
    } as unknown as ShopifyPageViewPayload;
  }, [matches, hasUserConsent]);
}

function AddToCartAnalytics({
  fetcher,
  children,
}: {
  fetcher: FetcherWithComponents<any>;
  children: React.ReactNode;
}) {
  const fetcherData = fetcher.data;
  const formData = fetcher.formData;
  const pageAnalytics = usePageAnalytics({ hasUserConsent: true });

  useEffect(() => {
    if (formData) {
      const cartData: Record<string, unknown> = {};
      const cartInputs = CartForm.getFormInput(formData);

      try {
        if (cartInputs.inputs.analytics) {
          const dataInForm: unknown = JSON.parse(
            String(cartInputs.inputs.analytics),
          );
          Object.assign(cartData, dataInForm);
        }
      } catch {
        // do nothing
      }

      if (Object.keys(cartData).length && fetcherData) {
        const addToCartPayload: ShopifyAddToCartPayload = {
          ...getClientBrowserParameters(),
          ...pageAnalytics,
          ...cartData,
          cartId: fetcherData.cart.id,
        };

        sendShopifyAnalytics({
          eventName: AnalyticsEventName.ADD_TO_CART,
          payload: addToCartPayload,
        });
      }
    }
  }, [fetcherData, formData, pageAnalytics]);

  return <>{children}</>;
}

function AddAllToCartButton({ lines }: { lines: OptimisticCartLineInput[] }) {
  return (
    <CartForm
      route="/cart"
      inputs={{ lines }}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => {
        return (
          <AddToCartAnalytics fetcher={fetcher}>
            <Button
              type="submit"
              className="w-auto min-w-[200px] uppercase"
              disabled={fetcher.state !== "idle"}
              onClick={() => toggleCartDrawer(true)}
            >
              View Cart
            </Button>
          </AddToCartAnalytics>
        );
      }}
    </CartForm>
  );
}
