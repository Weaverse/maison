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
import { useEffect, useMemo } from "react";
import type { FetcherWithComponents } from "react-router";
import { Await, useMatches, useRouteLoaderData } from "react-router";
import type {
  ProductQuery,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Button } from "~/components/button";
import { toggleCartDrawer } from "~/components/layout/cart-drawer";
import type { RootLoader } from "~/root";
import { DEFAULT_LOCALE } from "~/utils/const";
import { Subtotal } from "./subtotal";
import { VariantRow } from "./variant-row";

type Product = NonNullable<ProductQuery["product"]>;

interface VariantListItemsProps {
  variants: ProductVariantFragment[];
  product: Product;
}

interface VariantQuantity {
  [variantId: string]: number;
}

export function VariantListItems({ variants, product }: VariantListItemsProps) {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const sellingPlanGroups = product.sellingPlanGroups || { nodes: [] };

  return (
    <Await resolve={rootData.cart}>
      {(resolvedCart) => (
        <div>
          {/* mobile layout */}
          <div className="space-y-6 md:hidden">
            <div className="border-b border-line-subtle py-3">
              <p className="font-semibold text-sm">PRODUCTS</p>
            </div>
            <div className="space-y-6">
              {variants.map((variant) => (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  cart={resolvedCart}
                  sellingPlanGroups={sellingPlanGroups}
                />
              ))}
            </div>
          </div>

          <div className="md:hidden">
            <Subtotal cart={resolvedCart} variants={variants} />
          </div>

          {/* tablet layout */}
          <div className="hidden md:block lg:hidden space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-[3fr_2fr_1fr_1fr] gap-6 border-b border-line-subtle py-3">
                <div className="text-sm font-bold uppercase">Variant</div>
                <div className="text-sm font-bold uppercase">
                  Purchase Method
                </div>
                <div className="text-sm font-bold uppercase text-center">
                  Price
                </div>
                <div className="text-sm font-bold uppercase text-right ">
                  Variant Price
                </div>
              </div>
              <div className="space-y-6">
                {variants.map((variant) => (
                  <VariantRow
                    key={variant.id}
                    variant={variant}
                    cart={resolvedCart}
                    sellingPlanGroups={sellingPlanGroups}
                  />
                ))}
              </div>
            </div>

            <Subtotal cart={resolvedCart} variants={variants} />
          </div>

          {/* desktop layout */}
          <div className="hidden lg:block space-y-6">
            <div className="space-y-6">
              {sellingPlanGroups?.nodes?.length > 0 ? (
                <div className="grid grid-cols-[1fr_280px_270px_160px_153px] gap-6 border-b border-line-subtle py-3">
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
                  <div className="text-sm font-semibold uppercase text-right ">
                    Variant Price
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_270px_160px_153px] gap-6 border-b border-line-subtle py-3">
                  <div className="text-sm font-semibold uppercase">Variant</div>
                  <div className="text-sm font-semibold uppercase text-center">
                    Quantity
                  </div>
                  <div className="text-sm font-semibold uppercase text-center">
                    Price
                  </div>
                  <div className="text-sm font-semibold uppercase text-right ">
                    Variant Price
                  </div>
                </div>
              )}
              <div className="space-y-6">
                {variants.map((variant) => (
                  <VariantRow
                    key={variant.id}
                    variant={variant}
                    cart={resolvedCart}
                    sellingPlanGroups={sellingPlanGroups}
                  />
                ))}
              </div>
            </div>

            <Subtotal cart={resolvedCart} variants={variants} />
          </div>
        </div>
      )}
    </Await>
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
