import { useEffect } from "react";
import { useFetcher } from "react-router";
import { BreadCrumb } from "~/components/breadcrumb";
import Link from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { Section } from "~/components/section";
import { Swimlane } from "~/components/swimlane";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { FeaturedData } from "~/routes/($locale).api.featured-items";

export function NotFound({ type = "page" }: { type?: string }) {
  return (
    <Section width="fixed" verticalPadding="medium">
      <div className="flex flex-col items-center justify-center gap-10 py-20 lg:py-32 translate-y-[-10%]">
        <div className="flex flex-col justify-center items-center gap-2">
          <h1 className="text-[53px] leading-none text-body">404</h1>
          <h2 className=" text-[26px] font-normal text-center">
            {`${type.charAt(0).toUpperCase()}${type.slice(1)} not found`}
          </h2>
          <p className=" text-center text-sm">
            Oops! The {type} you're looking for doesn't exist.
          </p>
        </div>
        <div className="">
          <Link variant="secondary" to="/">
            Visit Homepage
          </Link>
        </div>
      </div>
      <FeaturedProducts />
    </Section>
  );
}

export function FeaturedProducts() {
  const { load, data } = useFetcher<FeaturedData>();
  const api = usePrefixPathWithLocale("/api/featured-items");

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation> --- IGNORE ---
  useEffect(() => {
    load(api);
  }, [api]);

  if (!data) {
    return null;
  }

  const { featuredProducts } = data;

  return (
    <div className="space-y-8 pt-20">
      <h5>Featured products</h5>
      <Swimlane className="gap-4">
        {featuredProducts.nodes.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            className="w-80 snap-start"
          />
        ))}
      </Swimlane>
    </div>
  );
}
