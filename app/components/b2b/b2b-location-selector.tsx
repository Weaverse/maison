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
          <div className="flex w-full max-w-[500px] flex-col gap-8 overflow-hidden rounded-[16px] bg-background shadow-xl">
            {/* Heading */}
            <div className="flex w-full items-start gap-4 bg-[#EBEAE5] px-10 py-4">
              <div className="flex min-w-0 flex-1 items-start py-2.5">
                <Dialog.Title className="whitespace-nowrap font-semibold text-base text-body leading-none tracking-[0.28px]">
                  Select company location
                </Dialog.Title>
              </div>
              <div className="flex items-center self-stretch">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-body transition-opacity hover:opacity-70"
                  aria-label="Close"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-8 px-10 pb-10">
              <Dialog.Description className="w-full text-base text-body leading-[1.6] tracking-[0.28px]">
                Select your location to shop with your company&rsquo;s custom
                pricing, specific product availability, and authorized checkout
                settings.
              </Dialog.Description>

              {/* Radio List */}
              <div className="flex w-full flex-col gap-2">
                {locations.map((location: CustomerCompanyLocation) => {
                  const selected = selectedLocationId === location.id;
                  return (
                    <label
                      key={location.id}
                      className="flex w-full cursor-pointer items-center gap-2"
                    >
                      <span className="relative flex size-[18px] shrink-0 items-center justify-center">
                        <input
                          type="radio"
                          name="location"
                          value={location.id}
                          checked={selected}
                          onChange={() => setSelectedLocationId(location.id)}
                          className="peer size-[18px] appearance-none rounded-full border border-[#7B7165] bg-transparent"
                        />
                        <span className="pointer-events-none absolute size-2.5 rounded-full bg-[#7B7165] opacity-0 peer-checked:opacity-100" />
                      </span>
                      <span
                        className={clsx(
                          "flex-1 text-base text-body leading-[1.6] tracking-[0.28px]",
                          selected && "font-semibold",
                        )}
                      >
                        {location.name}
                      </span>
                    </label>
                  );
                })}
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
                    className="w-full rounded-(--btn-border-radius) bg-(--btn-primary-bg) px-6 py-[18px] text-base text-(--btn-primary-text) leading-none tracking-[0.28px] transition-opacity hover:opacity-90 disabled:opacity-50"
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
