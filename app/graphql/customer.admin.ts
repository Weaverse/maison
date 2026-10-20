/**
 * Creates a company together with its first contact.
 *
 * `companyCreate` takes a `companyContact` and creates the customer, the
 * contact and the company in one operation, which is the only way to run this
 * signup without a half-finished state to recover from: creating the customer
 * separately writes the email before the company can be refused, and the
 * retry then dies on the duplicate email instead of reaching the step that
 * failed.
 *
 * `code` is selected alongside the message so a caller can tell a duplicate
 * apart from a validation error without matching on English text.
 */
export const companyCreateMutation = `#graphql
  mutation CompanyCreate($input: CompanyCreateInput!) {
    companyCreate(input: $input) {
      company {
        id
        name
        note
        mainContact {
          id
          customer {
            id
            email
          }
        }
      }
      userErrors {
        code
        field
        message
      }
    }
  }
` as const;

export const companiesQuery = `#graphql
  query Companies($first: Int!, $after: String) {
    companies(first: $first, after: $after) {
      edges {
        node {
          id
          name
          note
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

export const customersQuery = `#graphql
  query Customers($first: Int!, $after: String) {
    customers(first: $first, after: $after) {
      edges {
        node {
          id
          email
          firstName
          lastName
          phone
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

export const companyContactsQuery = `#graphql
  query CompanyContacts($companyId: ID!, $first: Int!) {
    company(id: $companyId) {
      id
      name
      contactsCount {
        count
      }
      contacts(first: $first) {
        edges {
          node {
            id
            customer {
              id
              email
              firstName
              lastName
            }
          }
        }
      }
    }
  }
` as const;
