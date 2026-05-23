import { B2BLocationSelector } from "~/components/b2b/b2b-location-selector";
import type { CustomerCompany } from "~/graphql/customer-locations-query.account";
import { CUSTOMER_LOCATIONS_QUERY } from "~/graphql/customer-locations-query.account";
import type { Route } from "./+types/b2blocations";

export async function loader({ context }: Route.LoaderArgs) {
  const { customerAccount } = context;

  // Guard: skip Customer Account API calls entirely for guest sessions.
  // Hydrogen 2026 throws on getBuyer() when OAuth/tunnel isn't set up,
  // which would otherwise crash every page via the global B2B provider fetch.
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return { company: null, companyLocationId: null, modalOpen: false };
  }

  let buyer: Awaited<ReturnType<typeof customerAccount.getBuyer>> | null = null;
  try {
    buyer = await customerAccount.getBuyer();
  } catch (err) {
    console.warn("[B2B] getBuyer failed:", (err as Error)?.message);
  }

  let companyLocationId = buyer?.companyLocationId || null;
  let company: CustomerCompany | null = null;

  // Check if logged in customer is a b2b customer
  if (buyer) {
    try {
      const customer = await customerAccount.query(CUSTOMER_LOCATIONS_QUERY);
      company =
        customer?.data?.customer?.companyContacts?.edges?.[0]?.node?.company ||
        null;
    } catch (err) {
      console.warn(
        "[B2B] CUSTOMER_LOCATIONS_QUERY failed:",
        (err as Error)?.message,
      );
    }
  }

  // If there is only 1 company location, set it in session
  if (!companyLocationId && company?.locations?.edges?.length === 1) {
    companyLocationId = company.locations.edges[0].node.id;

    customerAccount.setBuyer({
      companyLocationId,
    });
  }

  const modalOpen = Boolean(company) && !companyLocationId;

  return { company, companyLocationId, modalOpen };
}

export default function CartRoute() {
  return <B2BLocationSelector />;
}
