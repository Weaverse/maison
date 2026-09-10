import { CheckIcon } from "@phosphor-icons/react";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Dialog from "@radix-ui/react-dialog";
import { flattenConnection } from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import clsx from "clsx";
import {
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  useParams,
} from "react-router";
import { Button } from "~/components/button";
import Link from "~/components/link";
import type { AccountOutletContext } from "~/routes/($locale).account.edit";

export function AccountEditAddressForm() {
  const { t } = useTranslation();
  const { id: addressId } = useParams();
  const isNewAddress = addressId === "add";
  const actionData = useActionData<{ formError?: string }>();
  const { state } = useNavigation();
  const { customer } = useOutletContext<AccountOutletContext>();
  const addresses = flattenConnection(customer.addresses);
  const defaultAddress = customer.defaultAddress;
  /**
   * When a refresh happens (or a user visits this link directly), the URL
   * is actually stale because it contains a special token. This means the data
   * loaded by the parent and passed to the outlet contains a newer, fresher token,
   * and we don't find a match. We update the `find` logic to just perform a match
   * on the first (permanent) part of the ID.
   */
  const normalizedAddress = decodeURIComponent(addressId ?? "").split("?")[0];
  const address = addresses.find((ad) => ad.id?.startsWith(normalizedAddress));

  return (
    <div className="space-y-2">
      <div className="py-2.5 text-xl">
        {isNewAddress ? "Add new address" : "Edit address"}
      </div>
      <Form method="post" className="space-y-3">
        <input
          type="hidden"
          name="addressId"
          value={address?.id ?? addressId}
        />
        {actionData?.formError && (
          <div className="flex items-center justify-center bg-red-100 p-3 text-red-900">
            {actionData.formError}
          </div>
        )}
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="firstName"
          name="firstName"
          required
          type="text"
          autoComplete="given-name"
          placeholder={t("account.firstName")}
          aria-label={t("account.firstName")}
          defaultValue={address?.firstName ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="lastName"
          name="lastName"
          required
          type="text"
          autoComplete="family-name"
          placeholder={t("account.lastName")}
          aria-label={t("account.lastName")}
          defaultValue={address?.lastName ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          placeholder={t("account.company")}
          aria-label={t("account.company")}
          defaultValue={address?.company ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="address1"
          name="address1"
          type="text"
          autoComplete="address-line1"
          placeholder={t("account.address1")}
          required
          aria-label={t("account.address1")}
          defaultValue={address?.address1 ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="address2"
          name="address2"
          type="text"
          autoComplete="address-line2"
          placeholder={t("account.address2")}
          aria-label={t("account.address2")}
          defaultValue={address?.address2 ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="city"
          name="city"
          type="text"
          required
          autoComplete="address-level2"
          placeholder={t("account.city")}
          aria-label={t("account.city")}
          defaultValue={address?.city ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="zoneCode"
          name="zoneCode"
          type="text"
          autoComplete="address-level1"
          placeholder={t("account.province")}
          required
          aria-label={t("account.province")}
          defaultValue={address?.zoneCode ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="zip"
          name="zip"
          type="text"
          autoComplete="postal-code"
          placeholder={t("account.zip")}
          required
          aria-label={t("account.zip")}
          defaultValue={address?.zip ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="territoryCode"
          name="territoryCode"
          type="text"
          autoComplete="country"
          placeholder={t("account.countryCode")}
          required
          aria-label={t("account.countryCode")}
          defaultValue={address?.territoryCode ?? ""}
        />
        <input
          className="w-full appearance-none border border-line p-3 focus:outline-hidden"
          id="phone"
          name="phoneNumber"
          type="tel"
          autoComplete="tel"
          placeholder={t("account.phoneShort")}
          aria-label={t("account.phoneShort")}
          defaultValue={address?.phoneNumber ?? ""}
        />
        <div className="flex items-center gap-2.5">
          <Checkbox.Root
            name="defaultAddress"
            id="defaultAddress"
            defaultChecked={defaultAddress?.id === address?.id}
            className={clsx(
              "h-5 w-5 shrink-0",
              "border border-line focus-visible:outline-hidden",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Checkbox.Indicator className="flex items-center justify-center text-current">
              <CheckIcon className="h-4 w-4" weight="regular" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label htmlFor="defaultAddress">{t("account.setDefault")}</label>
        </div>
        <div className="flex items-center justify-end gap-6">
          <Dialog.Close asChild>
            <Link
              to="/account/address"
              className="underline-offset-4 hover:underline"
            >
              {t("account.cancel")}
            </Link>
          </Dialog.Close>
          <Button
            className="mb-2"
            type="submit"
            variant="primary"
            disabled={state !== "idle"}
          >
            {state === "submitting" ? "Saving" : "Save"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
