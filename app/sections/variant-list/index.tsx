import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { useLoaderData } from "react-router";
import { Section, sectionSettings } from "~/components/section";
import type { loader as productRouteLoader } from "~/routes/($locale).products.$productHandle";
import { isCombinedListing } from "~/utils/combined-listings";
import { VariantListItems } from "./variant-list-items";

interface VariantListSectionProps extends HydrogenComponentProps {}

const VariantListSection = forwardRef<HTMLElement, VariantListSectionProps>(
  (props, ref) => {
    const { product } = useLoaderData<typeof productRouteLoader>();

    const combinedListing = isCombinedListing(product);

    if (!product || combinedListing) {
      return null;
    }

    const variants = product.variants?.nodes || [];

    return (
      <Section ref={ref} {...props}>
        <VariantListItems variants={variants} product={product} />
      </Section>
    );
  },
);

export default VariantListSection;

export const schema = createSchema({
  type: "variant-list",
  title: "Variant list",
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: sectionSettings,
  presets: {
    headingText: "Select Variants",
  },
});
