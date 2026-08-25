import { CaretRightIcon, MapPinLineIcon } from "@phosphor-icons/react";
import type {
  CustomerCompanyLocation,
  CustomerCompanyLocationConnection,
} from "~/graphql/customer-locations-query.account";
import { cn } from "~/utils/cn";
import { useB2BLocation } from "./b2b-location-provider";

interface CompanyLocationButtonProps {
  /** Renders the "Company location:" caption above the button. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Opens the B2B location dialog. Borders and icons use `currentColor`, so the
 * caller sets the colour by putting a text colour on this component.
 */
export function CompanyLocationButton({
  showLabel = false,
  className,
}: CompanyLocationButtonProps) {
  const { company, companyLocationId, setModalOpen } = useB2BLocation();

  const locations: CustomerCompanyLocation[] = company?.locations?.edges
    ? company.locations.edges.map(
        (edge: CustomerCompanyLocationConnection) => edge.node,
      )
    : [];

  if (!company || locations.length === 0) {
    return null;
  }

  const selectedLocation =
    locations.find((location) => location.id === companyLocationId) ||
    locations[0];

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      {showLabel ? (
        <span className="pl-2 text-[12px] leading-none tracking-[0.24px]">
          Company location:
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex w-fit items-center gap-2 rounded-[8px] border border-current px-2 py-0.5 transition-opacity hover:opacity-70"
      >
        <span className="flex items-center gap-1">
          <MapPinLineIcon className="size-4 shrink-0" />
          <span className="whitespace-nowrap text-base leading-[1.6] tracking-[0.28px]">
            {selectedLocation?.name || "Select location"}
          </span>
        </span>
        <CaretRightIcon className="size-[14px] shrink-0" />
      </button>
    </div>
  );
}
