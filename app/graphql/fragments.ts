export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    quantityAvailable
    quantityRule {
          increment
          maximum
          minimum
        }
        quantityPriceBreaks (first: 10) {
          nodes {
            price {
              amount
              currencyCode
            }
            minimumQuantity
          }
        }
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    requiresComponents
    components(first: 10) {
      nodes {
        productVariant {
          id
          title
          product {
            handle
          }
        }
        quantity
      }
    }
    groupedBy(first: 10) {
      nodes {
        id
        title
        product {
          handle
        }
      }
    }
  }
` as const;

export const PRODUCT_OPTION_FRAGMENT = `#graphql
  fragment ProductOption on ProductOption {
    name
    optionValues {
      name
      firstSelectableVariant {
        ...ProductVariant
      }
      swatch {
        color
        image {
          previewImage {
            url
            altText
          }
        }
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    publishedAt
    handle
    vendor
    tags
    images(first: 50) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      ...ProductOption
    }
    badges: metafields(identifiers: [
      { namespace: "custom", key: "best_seller" }
    ]) {
      key
      namespace
      value
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    # Check if the product is a bundle
    isBundle: selectedOrFirstAvailableVariant(ignoreUnknownOptions: true, selectedOptions: { name: "", value: ""}) {
      ...on ProductVariant {
        requiresComponents
      }
    }
  }
  ${PRODUCT_OPTION_FRAGMENT}
`;

export const MEDIA_FRAGMENT = `#graphql
  fragment Media on Media {
    __typename
    mediaContentType
    alt
    previewImage {
      id
      url
      altText
      width
      height
    }
    ... on MediaImage {
      id
      image {
        id
        url
        width
        height
      }
    }
    ... on Video {
      id
      sources {
        mimeType
        url
      }
    }
    ... on Model3d {
      id
      sources {
        mimeType
        url
      }
    }
    ... on ExternalVideo {
      id
      embedUrl
      host
    }
  }
` as const;

export const SELLING_PLAN_FRAGMENT = `#graphql
  fragment SellingPlanMoney on MoneyV2 {
    amount
    currencyCode
  }
  fragment SellingPlan on SellingPlan {
    id
    name
    description
    recurringDeliveries
    options {
      name
      value
    }
    priceAdjustments {
      adjustmentValue {
        ... on SellingPlanFixedAmountPriceAdjustment {
          __typename
          adjustmentAmount {
            ...SellingPlanMoney
          }
        }
        ... on SellingPlanFixedPriceAdjustment {
          __typename
          price {
            ...SellingPlanMoney
          }
        }
        ... on SellingPlanPercentagePriceAdjustment {
          __typename
          adjustmentPercentage
        }
      }
    }
  }
` as const;

export const SELLING_PLAN_GROUP_FRAGMENT = `#graphql
  fragment SellingPlanGroup on SellingPlanGroup {
    name
    options {
      name
      values
    }
    sellingPlans(first: 10) {
      nodes {
        ...SellingPlan
      }
    }
  }
  ${SELLING_PLAN_FRAGMENT}
` as const;
