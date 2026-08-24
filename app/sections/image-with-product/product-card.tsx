import { TagIcon } from "@phosphor-icons/react";
import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import type { ProductQuery } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { PRODUCT_QUERY } from "~/graphql/queries";
import { cn } from "~/utils/cn";
import { isDiscounted } from "~/utils/product";

interface ImageWithProductCardData {
  product?: WeaverseProduct;
  backgroundImage?: WeaverseImage | string;
  detailsText: string;
  buttonText: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  labelBackgroundColor?: string;
  titleColor?: string;
  priceColor?: string;
  comparePriceColor?: string;
  tagIconColor?: string;
}

function resolveImage(value?: WeaverseImage | string) {
  if (!value) {
    return { url: IMAGES_PLACEHOLDERS.banner_1, altText: "Lifestyle image" };
  }
  if (typeof value === "string") {
    return { url: value, altText: "Lifestyle image" };
  }
  return value;
}

interface ImageWithProductCardProps
  extends HydrogenComponentProps<Awaited<ReturnType<typeof loader>>>,
    ImageWithProductCardData {
  ref?: React.Ref<HTMLElement>;
}

export default function ImageWithProductCard(props: ImageWithProductCardProps) {
  const {
    ref,
    product: _product,
    backgroundImage,
    detailsText,
    buttonText,
    buttonBackgroundColor,
    buttonTextColor,
    labelBackgroundColor,
    titleColor,
    priceColor,
    comparePriceColor,
    tagIconColor,
    loaderData,
    ...rest
  } = props;
  const product = loaderData?.product;
  const background = resolveImage(backgroundImage);
  const image = product?.featuredImage || {
    url: IMAGES_PLACEHOLDERS.product_1,
    altText: product?.title || "Product",
  };
  const variant = product?.selectedOrFirstAvailableVariant;
  const price = (variant?.price || product?.priceRange?.minVariantPrice) as
    | MoneyV2
    | undefined;
  const compareAtPrice = variant?.compareAtPrice as MoneyV2 | undefined;
  const showCompareAtPrice =
    price && compareAtPrice && isDiscounted(price, compareAtPrice);
  const href = product?.handle ? `/products/${product.handle}` : "#";

  return (
    <article
      ref={ref}
      {...rest}
      className="group relative aspect-square overflow-hidden rounded-[16px]"
    >
      <Image
        alt={background.altText || "Lifestyle image"}
        className="absolute inset-0 h-full w-full object-cover"
        data={background}
        sizes="(min-width: 768px) 50vw, 100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-[rgb(48_31_18_/_0%)] to-[rgb(162_146_122_/_80%)]"
      />

      <div className="relative flex h-full flex-col items-start justify-end gap-5 p-6 md:p-12">
        <div
          className="flex w-full max-w-[360px] flex-col gap-2 rounded-[16px] p-6"
          style={{ backgroundColor: labelBackgroundColor }}
        >
          <div className="grid grid-rows-[0fr] transition-all duration-500 ease-out md:group-hover:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <div className="w-full translate-y-6 overflow-hidden rounded-[16px] opacity-0 transition-all duration-500 ease-out md:group-hover:translate-y-0 md:group-hover:opacity-100">
                <Image
                  alt={image.altText || product?.title || "Product"}
                  aspectRatio="1/1"
                  className="w-full object-cover"
                  data={image}
                  sizes="(min-width: 768px) 360px, 100vw"
                />
              </div>
            </div>
          </div>

          <div className="flex w-full items-start gap-3">
            <p
              className="min-w-0 flex-1 font-serif text-[24px] leading-normal"
              style={{ color: titleColor }}
            >
              {product?.title || "Product title"}
            </p>
            <TagIcon
              size={28}
              className="shrink-0"
              style={{ color: tagIconColor }}
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 font-serif text-[24px] leading-normal">
            {showCompareAtPrice ? (
              <Money
                as="span"
                className="strike"
                data={compareAtPrice}
                style={{ color: comparePriceColor }}
                withoutTrailingZeros
              />
            ) : null}
            {price ? (
              <Money
                as="span"
                data={price}
                style={{ color: priceColor }}
                withoutTrailingZeros
              />
            ) : null}
          </div>

          <Link
            to={href}
            className={cn(
              "w-fit font-sans text-base leading-[1.6] tracking-[0.28px]",
              "underline decoration-solid [text-decoration-skip-ink:none] [text-underline-position:from-font]",
              !product && "pointer-events-none",
            )}
            style={{ color: titleColor }}
          >
            {detailsText || "View product details"}
          </Link>

          <div className="grid grid-rows-[0fr] transition-all duration-500 ease-out md:group-hover:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <Link
                to={href}
                className={cn(
                  "block w-full px-6 py-[18px] text-center text-sm tracking-wide",
                  "transition-all duration-500 ease-out",
                  "pointer-events-none translate-y-6 opacity-0",
                  "md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100",
                )}
                style={{
                  backgroundColor: buttonBackgroundColor,
                  color: buttonTextColor,
                }}
              >
                {buttonText || "Select options"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export const loader = async (
  args: ComponentLoaderArgs<ImageWithProductCardData>,
) => {
  const { weaverse, data } = args;
  if (!data?.product?.handle) {
    return null;
  }

  const { product } = await weaverse.storefront.query<ProductQuery>(
    PRODUCT_QUERY,
    {
      variables: {
        handle: data.product.handle,
        selectedOptions: [],
        language: weaverse.storefront.i18n.language,
        country: weaverse.storefront.i18n.country,
      },
    },
  );

  return { product };
};

export const schema = createSchema({
  type: "image-with-product--card",
  title: "Product card",
  settings: [
    {
      group: "Product",
      inputs: [
        {
          type: "product",
          name: "product",
          label: "Product",
          shouldRevalidate: true,
        },
      ],
    },
    {
      group: "Background",
      inputs: [
        {
          type: "image",
          name: "backgroundImage",
          label: "Background image",
        },
      ],
    },
    {
      group: "Default label",
      inputs: [
        {
          type: "text",
          name: "detailsText",
          label: "Details link text",
          defaultValue: "View product details",
        },
        {
          type: "color",
          name: "labelBackgroundColor",
          label: "Label background",
          defaultValue: "#EBEAE5",
        },
        {
          type: "color",
          name: "titleColor",
          label: "Title color",
          defaultValue: "#3C3428",
        },
        {
          type: "color",
          name: "priceColor",
          label: "Price color",
          defaultValue: "#3C3428",
        },
        {
          type: "color",
          name: "comparePriceColor",
          label: "Compare-at price color",
          defaultValue: "#7B7165",
        },
        {
          type: "color",
          name: "tagIconColor",
          label: "Tag icon color",
          defaultValue: "#524B46",
        },
      ],
    },
    {
      group: "Button",
      inputs: [
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Select options",
        },
        {
          type: "color",
          name: "buttonBackgroundColor",
          label: "Button background",
          defaultValue: "#8A7F68",
        },
        {
          type: "color",
          name: "buttonTextColor",
          label: "Button text color",
          defaultValue: "#F1EEEA",
        },
      ],
    },
  ],
  presets: {
    backgroundImage: IMAGES_PLACEHOLDERS.banner_1,
    detailsText: "View product details",
    labelBackgroundColor: "#EBEAE5",
    titleColor: "#3C3428",
    priceColor: "#3C3428",
    comparePriceColor: "#7B7165",
    tagIconColor: "#524B46",
    buttonText: "Select options",
    buttonBackgroundColor: "#8A7F68",
    buttonTextColor: "#F1EEEA",
  },
});
