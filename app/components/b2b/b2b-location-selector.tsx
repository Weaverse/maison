import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { CartForm } from "@shopify/hydrogen";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import type {
  CustomerCompanyLocation,
  CustomerCompanyLocationConnection,
} from "~/graphql/customer-locations-query.account";
import { useB2BLocation } from "./b2b-location-provider";

export function B2BLocationSelector() {
  const { company, modalOpen, setModalOpen, companyLocationId } =
    useB2BLocation();
  const [selectedLocationId, setSelectedLocationId] =
    useState<string>(companyLocationId);

  const fetcher = useFetcher({ key: "b2b-location-update" });
  const revalidator = useRevalidator();

  // Track location changes for revalidation
  const previousLocationIdRef = useRef(companyLocationId);
  const pendingLocationIdRef = useRef<string | null>(null);

  const locations = company?.locations?.edges
    ? company.locations.edges.map(
        (location: CustomerCompanyLocationConnection) => {
          return { ...location.node };
        },
      )
    : [];

  useEffect(() => {
    if (!selectedLocationId) {
      if (companyLocationId) {
        setSelectedLocationId(companyLocationId);
      } else if (locations.length > 0 && !selectedLocationId) {
        setSelectedLocationId(locations[0].id);
      }
    }
  }, [companyLocationId, locations, selectedLocationId]);

  // Revalidate after successful buyer identity update
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setModalOpen(false);

      // Only revalidate if location actually changed
      if (
        pendingLocationIdRef.current &&
        pendingLocationIdRef.current !== previousLocationIdRef.current
      ) {
        previousLocationIdRef.current = pendingLocationIdRef.current;
        pendingLocationIdRef.current = null;
        // Revalidate all loaders to refetch with new buyer context
        revalidator.revalidate();
      }
    }
  }, [fetcher.state, fetcher.data, setModalOpen, revalidator]);

  const open = Boolean(company && modalOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setModalOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in"
          style={{ "--fade-in-duration": "200ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            "data-[state=open]:animate-scale-in",
          ])}
          style={
            {
              "--scale-in-duration": "200ms",
            } as React.CSSProperties
          }
        >
          <div className="w-full max-w-[500px] overflow-hidden rounded-lg bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#F0EFEC] px-10 py-4">
              <Dialog.Title className="text-sm font-semibold text-[#4A4A4A] py-2.5">
                Select company location
              </Dialog.Title>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#4A4A4A] transition-colors hover:text-black"
                aria-label="Close"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="px-10 pt-8 pb-10">
              <Dialog.Description className="mb-8 text-base text-[#4A4A4A] leading-relaxed">
                Select your location to shop with your company&rsquo;s custom
                pricing, specific product availability, and authorized checkout
                settings.
              </Dialog.Description>

              {/* Radio List */}
              <div className="mb-8 space-y-3">
                {locations.map((location: CustomerCompanyLocation) => (
                  <label
                    key={location.id}
                    className="group flex cursor-pointer items-center gap-3"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="location"
                        value={location.id}
                        checked={selectedLocationId === location.id}
                        onChange={() => setSelectedLocationId(location.id)}
                        className="peer h-5 w-5 appearance-none rounded-full border border-[#8B8071] bg-transparent checked:border-[#8B8071]"
                      />
                      <div className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-[#8B8071] opacity-0 transition-opacity peer-checked:opacity-100" />
                    </div>
                    <span className="text-base font-medium text-[#4A4A4A] group-hover:text-black">
                      {location.name}
                    </span>
                  </label>
                ))}
              </div>

              {/* Confirm Button */}
              <CartForm
                key={selectedLocationId}
                route="/cart"
                action={CartForm.ACTIONS.BuyerIdentityUpdate}
                fetcherKey="b2b-location-update"
                inputs={{
                  buyerIdentity: { companyLocationId: selectedLocationId },
                }}
              >
                {() => (
                  <button
                    type="submit"
                    disabled={!selectedLocationId || fetcher.state !== "idle"}
                    className="w-full rounded-sm bg-[#8B8071] py-[18px] text-sm leading-none font-medium text-white transition-colors hover:bg-[#756a5b] disabled:opacity-50"
                    onClick={(event) => {
                      // Store pending location for revalidation trigger
                      pendingLocationIdRef.current = selectedLocationId;
                      fetcher.submit(event.currentTarget.form, {
                        method: "POST",
                      });
                    }}
                  >
                    {fetcher.state !== "idle" ? "Confirming..." : "Confirm"}
                  </button>
                )}
              </CartForm>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
