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
import { useMatches, useRouteLoaderData } from "react-router";
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

type Product = NonNullable<ProductQuery["product"]>;

interface VariantListItemsProps {
  variants: ProductVariantFragment[];
  product: Product;
}

interface VariantQuantity {
  [variantId: string]: number;
}

export function VariantListItems({ variants }: VariantListItemsProps) {
  const [quantities, setQuantities] = useState<VariantQuantity>({});
  const rootData = useRouteLoaderData<RootLoader>("root");
  const cart = rootData?.cart;

  const updateQuantity = (variantId: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [variantId]: quantity,
    }));
  };

  const removeVariant = (variantId: string) => {
    setQuantities((prev) => {
      const updated = { ...prev };
      delete updated[variantId];
      return updated;
    });
  };

  const lines: OptimisticCartLineInput[] = Object.entries(quantities)
    .filter(([_, qty]) => qty > 0)
    .map(([variantId, quantity]) => {
      const variant = variants.find((v) => v.id === variantId);
      return {
        merchandiseId: variantId,
        quantity,
        selectedVariant: variant,
      };
    });

  const totalItems = Object.values(quantities).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  const subtotal = Object.entries(quantities).reduce(
    (sum, [variantId, qty]) => {
      const variant = variants.find((v) => v.id === variantId);
      if (variant?.price?.amount) {
        return sum + Number.parseFloat(variant.price.amount) * qty;
      }
      return sum;
    },
    0,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-line pb-3">
          <div className="text-sm font-bold uppercase">Variant</div>
          <div className="text-sm font-bold uppercase text-center w-32">
            Quantity
          </div>
          <div className="text-sm font-bold uppercase text-right w-32">
            Price
          </div>
          <div className="text-sm font-bold uppercase text-right w-32">
            Variant Price
          </div>
        </div>
        <div className="space-y-6">
          {variants.map((variant) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              quantity={quantities[variant.id] || 0}
              onQuantityChange={(qty) => updateQuantity(variant.id, qty)}
              onRemove={() => removeVariant(variant.id)}
              enableAutoUpdate={true}
            />
          ))}
        </div>
      </div>

      {totalItems > 0 && (
        <div className="border-t border-line pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setQuantities({})}
                className="uppercase"
              >
                Clear List
              </Button>
              <RemoveAllFromCartButton cart={cart} />
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-body/70">
                  Total: {totalItems} items
                </div>
                <div className="text-sm">
                  Taxes, discounts and shipping calculated at checkout.
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-body/70">Subtotal:</div>
                <div className="text-2xl font-bold">${subtotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <AddAllToCartButton lines={lines} />
          </div>
        </div>
      )}
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

function RemoveAllFromCartButton({
  cart,
}: {
  cart: Promise<CartApiQueryFragment> | undefined;
}) {
  const [lineIds, setLineIds] = useState<string[]>([]);

  useEffect(() => {
    if (cart) {
      cart.then((resolvedCart) => {
        if (resolvedCart?.lines?.nodes?.length) {
          const ids = resolvedCart.lines.nodes.map((line) => line.id);
          setLineIds(ids);
        } else {
          setLineIds([]);
        }
      });
    }
  }, [cart]);

  if (!cart || lineIds.length === 0) {
    return null;
  }

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <Button
          type="submit"
          className="uppercase"
          disabled={fetcher.state !== "idle"}
        >
          Remove All from Cart
        </Button>
      )}
    </CartForm>
  );
}
