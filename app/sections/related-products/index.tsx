import { createSchema } from "@weaverse/hydrogen";
import { Suspense } from "react";
import { Await, useLoaderData } from "react-router";
import type { ProductCardFragment } from "storefront-api.generated";
import { ProductCard } from "~/components/product/product-card";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import { Swimlane } from "~/components/swimlane";

interface RelatedProductsProps extends SectionProps {
  ref: React.Ref<HTMLElement>;
}

export default function RelatedProducts(props: RelatedProductsProps) {
  const { ref, children, ...rest } = props;
  const { recommended } = useLoaderData<{
    recommended: { nodes: ProductCardFragment[] };
  }>();

  if (recommended) {
    return (
      <Section ref={ref} {...rest} overflow="unset">
        {children}
        <Suspense>
          <Await
            errorElement="There was a problem loading related products"
            resolve={recommended}
          >
            {(products) => {
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.nodes.slice(0, 4).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      className="w-full"
                    />
                  ))}
                </div>
              );
            }}
          </Await>
        </Suspense>
      </Section>
    );
  }
  return <section ref={ref} {...rest} />;
}

export const schema = createSchema({
  type: "related-products",
  title: "Related products",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  childTypes: ["related-products--header"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((i) => i.name !== "borderRadius"),
    },
  ],
  presets: {
    gap: 32,
    children: [
      {
        type: "related-products--header",
        gap: 16,
        children: [
          {
            type: "heading",
            content: "You may also like",
            as: "h6",
            weight: 400,
            alignment: "left",
          },
          {
            type: "view-all-button",
            text: "View All",
            link: "/products",
            showButton: true,
          },
        ],
      },
    ],
  },
});
