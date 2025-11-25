import {
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData } from "react-router";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";

const DotIcon = () => (
  <svg
    width="6"
    height="6"
    viewBox="0 0 6 6"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="3" cy="3" r="3" className="fill-body-subtle" />
  </svg>
);

interface ProductStockProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
}

export default function ProductStock(props: ProductStockProps) {
  const { ref, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  if (!product) {
    return null;
  }

  const quantityAvailable = selectedVariant?.quantityAvailable;

  if (quantityAvailable == null) {
    return null;
  }

  return (
    <div ref={ref} {...rest} className="flex items-center gap-1.5">
      <DotIcon />
      <span className="text-xs text-body-subtle">
        {quantityAvailable} in Stock
      </span>
    </div>
  );
}

export const schema = createSchema({
  type: "mp--stock",
  title: "Stock",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
});
