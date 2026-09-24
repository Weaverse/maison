import type { CustomerAddressInput } from "@shopify/hydrogen/customer-account-api-types";
import { useTranslation } from "@weaverse/hydrogen";
import type {
  AddressPartialFragment,
  CustomerDetailsFragment,
} from "customer-account-api.generated";
import {
  type ActionFunctionArgs,
  data,
  type Fetcher,
  Form,
  type LoaderFunctionArgs,
  type MetaFunction,
  useActionData,
  useNavigation,
  useOutletContext,
} from "react-router";
import {
  CREATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  UPDATE_ADDRESS_MUTATION,
} from "./($locale).account.address.$id";

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressPartialFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressPartialFragment["id"], string> | null;
  updatedAddress?: AddressPartialFragment;
};

export const meta: MetaFunction = () => {
  return [{ title: "Addresses" }];
};

export async function loader({ context }: LoaderFunctionArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { customerAccount } = context;

  try {
    const form = await request.formData();

    const addressId = form.has("addressId")
      ? String(form.get("addressId"))
      : null;
    if (!addressId) {
      throw new Error("You must provide an address id.");
    }

    // this will ensure redirecting to login never happen for mutation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        { error: { [addressId]: "Unauthorized" } },
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has("defaultAddress")
      ? String(form.get("defaultAddress")) === "on"
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      "address1",
      "address2",
      "city",
      "company",
      "territoryCode",
      "firstName",
      "lastName",
      "phoneNumber",
      "zoneCode",
      "zip",
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === "string") {
        address[key] = value;
      }
    }

    switch (request.method) {
      case "POST": {
        // handle new address creation
        try {
          const { data: createData, errors } = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: { address, defaultAddress },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (createData?.customerAddressCreate?.userErrors?.length) {
            throw new Error(
              createData?.customerAddressCreate?.userErrors[0].message,
            );
          }

          if (!createData?.customerAddressCreate?.customerAddress) {
            throw new Error("Customer address create failed.");
          }

          return {
            error: null,
            createdAddress: createData?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      case "PUT": {
        // handle address updates
        try {
          const { data: updateData, errors } = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (updateData?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(
              updateData?.customerAddressUpdate?.userErrors[0].message,
            );
          }

          if (!updateData?.customerAddressUpdate?.userErrors?.length) {
            throw new Error("Customer address update failed.");
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      case "DELETE": {
        // handles address deletion
        try {
          const { data: delateData, errors } = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: { addressId: decodeURIComponent(addressId) },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (delateData?.customerAddressDelete?.userErrors?.length) {
            throw new Error(
              delateData?.customerAddressDelete?.userErrors[0].message,
            );
          }

          if (!delateData?.customerAddressDelete?.deletedAddressId) {
            throw new Error("Customer address delete failed.");
          }

          return { error: null, deletedAddress: addressId };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              { error: { [addressId]: error.message } },
              {
                status: 400,
              },
            );
          }
          return data(
            { error: { [addressId]: error } },
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          { error: { [addressId]: "Method not allowed" } },
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data(
        { error: error.message },
        {
          status: 400,
        },
      );
    }
    return data(
      { error },
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const { t } = useTranslation();
  const { customer } = useOutletContext<{
    customer: CustomerDetailsFragment;
  }>();
  const { defaultAddress, addresses } = customer;

  return (
    <div className="account-addresses">
      <h2>{t("account.addresses")}</h2>
      <br />
      {addresses.edges.length ? (
        <div>
          <div>
            <legend>{t("account.createAddress")}</legend>
            <NewAddressForm />
          </div>
          <br />
          <hr />
          <br />
          <ExistingAddresses
            addresses={addresses}
            defaultAddress={defaultAddress}
          />
        </div>
      ) : (
        <p>{t("account.noAddressesSaved")}</p>
      )}
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: "",
    address2: "",
    city: "",
    company: "",
    territoryCode: "",
    firstName: "",
    id: "new",
    lastName: "",
    phoneNumber: "",
    zoneCode: "",
    zip: "",
  } as CustomerAddressInput;

  return (
    <AddressForm
      addressId={"NEW_ADDRESS_ID"}
      address={newAddress}
      defaultAddress={null}
    >
      {({ stateForMethod }) => (
        <div>
          <button
            disabled={stateForMethod("POST") !== "idle"}
            formMethod="POST"
            type="submit"
          >
            {stateForMethod("POST") !== "idle" ? "Creating" : "Create"}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: Pick<CustomerDetailsFragment, "addresses" | "defaultAddress">) {
  const { t } = useTranslation();
  return (
    <div>
      <legend>{t("account.existingAddresses")}</legend>
      {addresses.edges.map(({ node: address }) => (
        <AddressForm
          key={address.id}
          addressId={address.id}
          address={address}
          defaultAddress={defaultAddress}
        >
          {({ stateForMethod }) => (
            <div>
              <button
                disabled={stateForMethod("PUT") !== "idle"}
                formMethod="PUT"
                type="submit"
              >
                {stateForMethod("PUT") !== "idle" ? "Saving" : "Save"}
              </button>
              <button
                disabled={stateForMethod("DELETE") !== "idle"}
                formMethod="DELETE"
                type="submit"
              >
                {stateForMethod("DELETE") !== "idle" ? "Deleting" : "Delete"}
              </button>
            </div>
          )}
        </AddressForm>
      ))}
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressPartialFragment["id"];
  address: CustomerAddressInput;
  defaultAddress: CustomerDetailsFragment["defaultAddress"];
  children: (props: {
    stateForMethod: (method: "PUT" | "POST" | "DELETE") => Fetcher["state"];
  }) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const { state, formMethod } = useNavigation();
  const actionData = useActionData<ActionResponse>();
  const error = actionData?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  return (
    <Form id={addressId}>
      <fieldset>
        <input type="hidden" name="addressId" defaultValue={addressId} />
        <label htmlFor="firstName">{t("account.firstName")}*</label>
        <input
          aria-label={t("account.firstName")}
          autoComplete="given-name"
          defaultValue={address?.firstName ?? ""}
          id="firstName"
          name="firstName"
          placeholder={t("account.firstName")}
          required
          type="text"
        />
        <label htmlFor="lastName">{t("account.lastName")}*</label>
        <input
          aria-label={t("account.lastName")}
          autoComplete="family-name"
          defaultValue={address?.lastName ?? ""}
          id="lastName"
          name="lastName"
          placeholder={t("account.lastName")}
          required
          type="text"
        />
        <label htmlFor="company">{t("account.company")}</label>
        <input
          aria-label={t("account.company")}
          autoComplete="organization"
          defaultValue={address?.company ?? ""}
          id="company"
          name="company"
          placeholder={t("account.company")}
          type="text"
        />
        <label htmlFor="address1">{t("account.address1")}*</label>
        <input
          aria-label={t("account.address1")}
          autoComplete="address-line1"
          defaultValue={address?.address1 ?? ""}
          id="address1"
          name="address1"
          placeholder={`${t("account.address1")}*`}
          required
          type="text"
        />
        <label htmlFor="address2">{t("account.address2")}</label>
        <input
          aria-label={t("account.address2")}
          autoComplete="address-line2"
          defaultValue={address?.address2 ?? ""}
          id="address2"
          name="address2"
          placeholder={t("account.address2")}
          type="text"
        />
        <label htmlFor="city">{t("account.city")}*</label>
        <input
          aria-label={t("account.city")}
          autoComplete="address-level2"
          defaultValue={address?.city ?? ""}
          id="city"
          name="city"
          placeholder={t("account.city")}
          required
          type="text"
        />
        <label htmlFor="zoneCode">{t("account.province")}*</label>
        <input
          aria-label={t("account.province")}
          autoComplete="address-level1"
          defaultValue={address?.zoneCode ?? ""}
          id="zoneCode"
          name="zoneCode"
          placeholder={t("account.province")}
          required
          type="text"
        />
        <label htmlFor="zip">{t("account.zip")}*</label>
        <input
          aria-label={t("account.zip")}
          autoComplete="postal-code"
          defaultValue={address?.zip ?? ""}
          id="zip"
          name="zip"
          placeholder={t("account.zip")}
          required
          type="text"
        />
        <label htmlFor="territoryCode">{t("account.countryCode")}*</label>
        <input
          aria-label="territoryCode"
          autoComplete="country"
          defaultValue={address?.territoryCode ?? ""}
          id="territoryCode"
          name="territoryCode"
          placeholder={t("account.country")}
          required
          type="text"
          maxLength={2}
        />
        <label htmlFor="phoneNumber">{t("account.phoneShort")}</label>
        <input
          aria-label={t("account.phoneNumber")}
          autoComplete="tel"
          defaultValue={address?.phoneNumber ?? ""}
          id="phoneNumber"
          name="phoneNumber"
          placeholder="+16135551111"
          pattern="^\+?[1-9]\d{3,14}$"
          type="tel"
        />
        <div>
          <input
            defaultChecked={isDefaultAddress}
            id="defaultAddress"
            name="defaultAddress"
            type="checkbox"
          />
          <label htmlFor="defaultAddress">{t("account.setDefault")}</label>
        </div>
        {error ? (
          <p>
            <mark>
              <small>{error}</small>
            </mark>
          </p>
        ) : (
          <br />
        )}
        {children({
          stateForMethod: (method) => (formMethod === method ? state : "idle"),
        })}
      </fieldset>
    </Form>
  );
}
