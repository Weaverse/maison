import type { Collection } from "@shopify/hydrogen/storefront-api-types";
import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { Image } from "~/components/image";
import Link from "~/components/link";
import type { ImageAspectRatio } from "~/types/image";
import { cn } from "~/utils/cn";
import { calculateAspectRatio } from "~/utils/image";

interface CollectionCardProps {
  collection: Collection;
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

function getCollectionImage(collection: Collection) {
  if (collection.image) {
    return collection.image;
  }

  const firstProduct = collection.products.nodes[0];
  const firstProductMedia = firstProduct?.media?.nodes[0];
  return firstProductMedia?.previewImage ?? null;
}

function getProductCount(collection: Collection) {
  const productsCount = (
    collection as Collection & { productsCount?: { count?: number } | null }
  ).productsCount?.count;

  if (typeof productsCount === "number") {
    return productsCount;
  }

  return collection.products.nodes.length;
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
  const productCount = getProductCount(collection);

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
        {showProductCount && (
          <span className="text-sm" style={{ color: countColor }}>
            {`${productCount} products`}
          </span>
        )}
      </div>
    </Link>
  );
}
