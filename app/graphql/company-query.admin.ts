const companyCreateMutation = `#graphql
  mutation Company($input: CompanyCreateInput!) {
    companyCreate(input: $input) {
      company {
        id
        name
        note
      }
    }
  }
` as const;


const assignCustomerToCompanyMutation = `#graphql
mutation Company($companyId: ID!, $customerId: ID!) {
  companyAssignCustomerAsContact(companyId: $companyId, customerId:$customerId){
    companyContact {id}
  }
}
` as const;