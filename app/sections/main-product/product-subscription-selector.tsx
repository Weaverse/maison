import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData, useSearchParams } from "react-router";
import { SellingPlanSelector } from "~/components/product/selling-plan-selector";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import { isCombinedListing } from "~/utils/combined-listings";

interface ProductSubscriptionSelectorProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
}

export default function ProductSubscriptionSelector(
  props: ProductSubscriptionSelectorProps,
) {
  const { ref, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();
  const [searchParams] = useSearchParams();

  const combinedListing = isCombinedListing(product);

  if (!product || combinedListing) {
    return null;
  }

  const sellingPlanGroups = product.sellingPlanGroups;
  const selectedSellingPlanId = searchParams.get("selling_plan");

  // Only show if product has selling plans
  if (!sellingPlanGroups?.nodes?.length) {
    return null;
  }

  return (
    <div ref={ref} {...rest}>
      <SellingPlanSelector
        sellingPlanGroups={sellingPlanGroups}
        selectedSellingPlanId={selectedSellingPlanId}
      />
    </div>
  );
}

export const schema = createSchema({
  type: "mp--subscription-selector",
  title: "Subscription selector",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [],
});
