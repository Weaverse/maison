import {
  getAdjacentAndFirstAvailableVariants,
  Money,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData, useSearchParams } from "react-router";
import { VariantPrices } from "~/components/product/variant-prices";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import { isCombinedListing } from "~/utils/combined-listings";

interface ProductPricesProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  showCompareAtPrice: boolean;
}

function SellingPlanPrice({
  price,
  sellingPlan,
}: {
  price: { amount: string; currencyCode: string };
  sellingPlan: {
    priceAdjustments: Array<{
      adjustmentValue: {
        adjustmentPercentage?: number;
        adjustmentAmount?: { amount: string; currencyCode: string };
        price?: { amount: string; currencyCode: string };
      };
    }>;
  };
}) {
  const priceAdjustment = sellingPlan?.priceAdjustments?.[0];
  const adjustmentValue = priceAdjustment?.adjustmentValue;

  if (!adjustmentValue) {
    return <Money withoutTrailingZeros data={price as any} />;
  }

  // Fixed price
  if ("price" in adjustmentValue && adjustmentValue.price) {
    return <Money withoutTrailingZeros data={adjustmentValue.price as any} />;
  }

  // Fixed amount off
  if (
    "adjustmentAmount" in adjustmentValue &&
    adjustmentValue.adjustmentAmount
  ) {
    const adjustedPrice = {
      amount: String(
        Number(price.amount) - Number(adjustmentValue.adjustmentAmount.amount),
      ),
      currencyCode: price.currencyCode,
    };
    return <Money withoutTrailingZeros data={adjustedPrice as any} />;
  }

  // Percentage off
  if (
    "adjustmentPercentage" in adjustmentValue &&
    adjustmentValue.adjustmentPercentage
  ) {
    const adjustedPrice = {
      amount: String(
        Number(price.amount) * (1 - adjustmentValue.adjustmentPercentage / 100),
      ),
      currencyCode: price.currencyCode,
    };
    return <Money withoutTrailingZeros data={adjustedPrice as any} />;
  }

  return <Money withoutTrailingZeros data={price as any} />;
}

export default function ProductPrices(props: ProductPricesProps) {
  const { ref, showCompareAtPrice, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();
  const [searchParams] = useSearchParams();
  const sellingPlanId = searchParams.get("selling_plan");

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  const combinedListing = isCombinedListing(product);

  if (!product) {
    return null;
  }

  // Find the selected selling plan
  const selectedSellingPlan = sellingPlanId
    ? product.sellingPlanGroups?.nodes
        ?.flatMap(
          (group: { sellingPlans: { nodes: Array<{ id: string }> } }) =>
            group.sellingPlans.nodes,
        )
        .find((plan: { id: string }) => plan.id === sellingPlanId)
    : null;

  return (
    <div ref={ref} {...rest}>
      {combinedListing ? (
        <div className="flex gap-2 text-2xl/none text-body-subtle">
          <span className="flex gap-1">
            From
            <VariantPrices
              variant={{ price: product.priceRange.minVariantPrice }}
              showCompareAtPrice={false}
            />
          </span>
          <span className="flex gap-1">
            To
            <VariantPrices
              variant={{ price: product.priceRange.maxVariantPrice }}
              showCompareAtPrice={false}
            />
          </span>
        </div>
      ) : selectedSellingPlan && selectedVariant?.price ? (
        <div className="flex items-center gap-2 text-2xl/none text-body-subtle">
          <SellingPlanPrice
            price={selectedVariant.price}
            sellingPlan={selectedSellingPlan as any}
          />
          <span className="text-sm line-through text-body-subtle/60">
            <Money withoutTrailingZeros data={selectedVariant.price} />
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {product.priceRange.minVariantPrice.amount !==
            product.priceRange.maxVariantPrice.amount && <span>From</span>}
          <VariantPrices
            variant={selectedVariant}
            showCompareAtPrice={showCompareAtPrice}
            className="text-2xl/none text-body-subtle"
          />
        </div>
      )}
    </div>
  );
}

export const schema = createSchema({
  type: "mp--prices",
  title: "Prices",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "switch",
          label: "Show compare at price",
          name: "showCompareAtPrice",
          defaultValue: true,
        },
      ],
    },
  ],
});
