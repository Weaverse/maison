import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { ProductQuery } from "storefront-api.generated";
import { useB2BLocation } from "~/components/b2b/b2b-location-provider";

interface UseVolumePricingOptions {
  productHandle: string;
  variantId?: string;
  enabled?: boolean;
}

interface UseVolumePricingResult {
  hasVolumePricing: boolean;
  isLoading: boolean;
}

export function useVolumePricing({
  productHandle,
  variantId,
  enabled = true,
}: UseVolumePricingOptions): UseVolumePricingResult {
  const { companyLocationId } = useB2BLocation();
  const fetcher = useFetcher<{ product: ProductQuery["product"] }>();
  const [hasVolumePricing, setHasVolumePricing] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetcher.load would cause infinite loop
  useEffect(() => {
    if (!(enabled && productHandle)) {
      return;
    }

    // Fetch product data with buyer context
    // The API route automatically includes buyer context from session
    // Pass companyLocationId as query param to force refetch when location changes
    const url = companyLocationId
      ? `/api/product/${productHandle}?locationId=${companyLocationId}`
      : `/api/product/${productHandle}`;
    fetcher.load(url);
  }, [productHandle, companyLocationId, enabled]);

  useEffect(() => {
    if (fetcher.data?.product) {
      const { product } = fetcher.data;

      // Find the target variant
      let targetVariant = product.variants.nodes.find(
        (v) => v.id === variantId,
      );

      // Fallback to first variant if specific variant not found
      if (!targetVariant && product.variants.nodes.length > 0) {
        targetVariant = product.variants.nodes[0];
      }

      // Check if variant has volume pricing
      const hasVolumePrice =
        (targetVariant?.quantityPriceBreaks?.nodes?.length ?? 0) > 0;

      setHasVolumePricing(hasVolumePrice);
    }
  }, [fetcher.data, variantId]);

  return {
    hasVolumePricing,
    isLoading: fetcher.state === "loading",
  };
}
