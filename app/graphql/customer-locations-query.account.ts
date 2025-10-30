import type {
  Company,
  CompanyAddress,
  CompanyLocation,
  Maybe,
} from "@shopify/hydrogen/customer-account-api-types";

// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Customer
export const CUSTOMER_LOCATIONS_QUERY = `#graphql
  query CustomerLocations {
    customer {
      id
      emailAddress {
        emailAddress
      }
      companyContacts(first: 1){
        edges{
          node{
            company{
              id
              name
              locations(first: 10){
                edges{
                  node{
                    id
                    name
                    shippingAddress {
                      countryCode
                      formattedAddress
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
` as const;

export type CustomerCompanyLocation = Pick<CompanyLocation, "name" | "id"> & {
  shippingAddress?:
    | Maybe<Pick<CompanyAddress, "countryCode" | "formattedAddress">>
    | undefined;
};

export type CustomerCompanyLocationConnection = {
  node: CustomerCompanyLocation;
};

export type CustomerCompany =
  | Maybe<
      Pick<Company, "name" | "id"> & {
        locations: {
          edges: CustomerCompanyLocationConnection[];
        };
      }
    >
  | undefined;
