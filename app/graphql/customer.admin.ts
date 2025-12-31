export const companyCreateMutation = `#graphql
  mutation CompanyCreate($input: CompanyCreateInput!) {
    companyCreate(input: $input) {
      company {
        id
        name
        note
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

export const customerCreateMutation = `#graphql
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

export const assignCustomerToCompanyMutation = `#graphql
  mutation CompanyAssignCustomer($companyId: ID!, $customerId: ID!) {
    companyAssignCustomerAsContact(companyId: $companyId, customerId: $customerId) {
      companyContact {
        id
      }
      userErrors {
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