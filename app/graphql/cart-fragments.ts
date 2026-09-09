export const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    discountAllocations {
      discountedAmount {
        ...Money
      }
      ... on CartCodeDiscountAllocation {
        code
      }
    }
    sellingPlanAllocation {
      sellingPlan {
        id
        name
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
        quantityRule {
          increment
          minimum
          maximum
        }
      }
    }
  }
  fragment CartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    discountAllocations {
      discountedAmount {
        ...Money
      }
      ... on CartCodeDiscountAllocation {
        code
      }
    }
    sellingPlanAllocation {
      sellingPlan {
        id
        name
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
        quantityRule {
          increment
          minimum
          maximum
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
      }
    }
  }
  fragment CartApiQuery on Cart {
    updatedAt
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
      nodes {
        ...CartLineComponent
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountAllocations {
      discountedAmount {
        ...Money
      }
      ... on CartCodeDiscountAllocation {
        code
      }
    }
    discountCodes {
      code
      applicable
    }
    appliedGiftCards {
      id
      amountUsed {
        ...Money
      }
      lastCharacters
    }
  }
` as const;

export const CART_MUTATION_FRAGMENT = CART_QUERY_FRAGMENT.replace(
  "fragment CartApiQuery on Cart",
  "fragment CartApiMutation on Cart",
).replaceAll("$numCartLines", "250");
