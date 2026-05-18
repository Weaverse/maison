import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { CartForm } from "@shopify/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type {
  CustomerCompanyLocation,
  CustomerCompanyLocationConnection,
} from "~/graphql/customer-locations-query.account";
import { useB2BLocation } from "./b2b-location-provider";

const B2B_UPDATE_KEY = "b2b-location-update";

export function B2BLocationSelector() {
  const { company, modalOpen, setModalOpen, companyLocationId } =
    useB2BLocation();
  const fetcher = useFetcher({ key: B2B_UPDATE_KEY });

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setModalOpen(false);
      window.location.reload();
    }
  }, [fetcher.state, fetcher.data, setModalOpen]);

  const [selectedLocationId, setSelectedLocationId] =
    useState<string>(companyLocationId);
  console.log(
    "🚀 ~ B2BLocationSelector ~ selectedLocationId:",
    selectedLocationId,
  );

  let onCheckedChange = (value: string) => {
    console.log("🚀 ~ onCheckedChange ~ value:", value, selectedLocationId);
    setSelectedLocationId(value);
  };

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
  }, [companyLocationId, locations]);

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
          <div className="w-full max-w-[500px] overflow-hidden rounded-sm bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#F0EFEC] px-6 py-4">
              <Dialog.Title className="text-lg font-semibold text-[#4A4A4A]">
                Select company location
              </Dialog.Title>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#4A4A4A] transition-colors hover:text-black"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <Dialog.Description className="mb-6 text-base text-[#4A4A4A] leading-relaxed">
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
                        onChange={() => onCheckedChange(location.id)}
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
                fetcherKey={B2B_UPDATE_KEY}
                inputs={{
                  buyerIdentity: { companyLocationId: selectedLocationId },
                }}
              >
                {() => (
                  <button
                    type="submit"
                    disabled={!selectedLocationId || fetcher.state !== "idle"}
                    className="w-full rounded-sm bg-[#8B8071] py-3 text-lg font-medium text-white transition-colors hover:bg-[#756a5b] disabled:opacity-50"
                    onClick={(event) => {
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
