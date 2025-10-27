import { B2BLocationSelector } from "~/components/b2b/b2b-location-selector";
import type { Route } from "./+types/b2blocations";
import { CUSTOMER_LOCATIONS_QUERY } from "~/graphql/customer-locations-query";

export async function loader({ context }: Route.LoaderArgs) {
  const { customerAccount } = context;

  const buyer = await customerAccount.getBuyer();

  let companyLocationId = buyer?.companyLocationId || null;
  let company = null;

  // Check if logged in customer is a b2b customer
  if (buyer) {
    const customer = await customerAccount.query(CUSTOMER_LOCATIONS_QUERY);
    company =
      customer?.data?.customer?.companyContacts?.edges?.[0]?.node?.company ||
      null;
    console.log("🚀 ~ loader ~ company:", company);
  }

  // If there is only 1 company location, set it in session
  if (!companyLocationId && company?.locations?.edges?.length === 1) {
    companyLocationId = company.locations.edges[0].node.id;

    customerAccount.setBuyer({
      companyLocationId,
    });
  }

  const modalOpen = Boolean(company) && !companyLocationId;
  console.log("🚀 ~ loader ~ modalOpen:", modalOpen, company);

  return { company, companyLocationId, modalOpen };
}

export default function CartRoute() {
  return <B2BLocationSelector />;
}
