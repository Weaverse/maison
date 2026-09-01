import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import type { CollectionsQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import Link from "~/components/link";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { calculateAspectRatio } from "~/utils/image";

/** Exactly what the collections query returns, so no cast is needed. */
type CollectionCardData = CollectionsQuery["collections"]["nodes"][number];

interface CollectionCardProps {
  collection: CollectionCardData;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius: number;
  titleColor?: string;
  countColor?: string;
  showProductCount?: boolean;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  cardPadding?: number;
  cardBorderRadius?: number;
  loading?: HTMLImageElement["loading"];
}

function getCollectionImage(collection: CollectionCardData) {
  if (collection.image) {
    return collection.image;
  }

  const firstProduct = collection.products.nodes[0];
  const firstProductMedia = firstProduct?.media?.nodes[0];
  return firstProductMedia?.previewImage ?? null;
}

// The Storefront API has no count field on Collection, so the query fetches up
// to 50 product ids under the `productCount` alias. Past that the label reads
// "50+" rather than reporting a wrong number.
function getProductCountLabel(collection: CollectionCardData) {
  const { productCount } = collection;

  if (!productCount) {
    return null;
  }

  const total = productCount.nodes.length;
  const suffix = productCount.pageInfo.hasNextPage ? "+" : "";
  return `${total}${suffix} ${total === 1 && !suffix ? "product" : "products"}`;
}

export function CollectionCard({
  collection,
  imageAspectRatio,
  imageBorderRadius,
  titleColor,
  countColor,
  showProductCount = true,
  cardBackgroundColor,
  cardHoverBackgroundColor,
  cardPadding,
  cardBorderRadius,
  loading,
}: CollectionCardProps) {
  if (collection.products.nodes.length === 0) {
    return null;
  }

  const collectionImage = getCollectionImage(collection);
  const productCountLabel = getProductCountLabel(collection);

  return (
    <Link
      to={`/collections/${collection.handle}`}
      className={cn(
        "group flex flex-col gap-5 transition-colors duration-300",
        "bg-(--card-bg)",
        cardHoverBackgroundColor && "hover:bg-(--hover-bg)",
      )}
      style={
        {
          "--card-bg": cardBackgroundColor,
          ...(cardHoverBackgroundColor && {
            "--hover-bg": cardHoverBackgroundColor,
          }),
          padding: `${cardPadding}px`,
          borderRadius: `${cardBorderRadius}px`,
        } as CSSProperties
      }
      data-motion="fade-up"
    >
      {collectionImage ? (
        <div
          className="overflow-hidden"
          style={{ borderRadius: `${imageBorderRadius}px` }}
        >
          <Image
            data={collectionImage}
            aspectRatio={calculateAspectRatio(
              collectionImage,
              imageAspectRatio,
            )}
            sizes="auto"
            loading={loading}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          className="w-full overflow-hidden bg-gray-100"
          style={{ borderRadius: `${imageBorderRadius}px` }}
        >
          <Image
            data={{ url: IMAGES_PLACEHOLDERS.image }}
            aspectRatio={imageAspectRatio}
            sizes="auto"
            loading={loading}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="w-fit">
          <h6
            className="font-normal text-[26px] line-clamp-1 leading-6"
            style={{ color: titleColor }}
          >
            {collection.title ?? "Title here"}
          </h6>
          <div
            className="h-[1px] w-0 transition-all duration-500 group-hover:w-full"
            style={{ backgroundColor: titleColor || "currentColor" }}
          />
        </div>
        {showProductCount && productCountLabel && (
          <span className="text-sm" style={{ color: countColor }}>
            {productCountLabel}
          </span>
        )}
      </div>
    </Link>
  );
}
