import { useTranslation } from "@weaverse/hydrogen";
import type { CustomerDetailsFragment } from "customer-account-api.generated";
import { Link } from "~/components/link";

export function AccountDetails({
  customer,
}: {
  customer: CustomerDetailsFragment;
}) {
  const { t } = useTranslation();
  const { firstName, lastName, emailAddress, phoneNumber } = customer;
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  return (
    <div className="space-y-4">
      <div className="font-bold">{t("account.title")}</div>
      <div className="space-y-4 border border-line-subtle p-5">
        <div className="space-y-1">
          <div className="text-body-subtle">{t("account.name")}</div>
          <div>{fullName || "N/A"}</div>
        </div>

        <div className="space-y-1">
          <div className="text-body-subtle">{t("account.phone")}</div>
          <div>{phoneNumber?.phoneNumber ?? "N/A"}</div>
        </div>

        <div className="space-y-1">
          <div className="text-body-subtle">{t("account.email")}</div>
          <div>{emailAddress?.emailAddress ?? "N/A"}</div>
        </div>

        <div>
          <Link
            prefetch="intent"
            variant="underline"
            className="text-body-subtle after:bg-body-subtle"
            to="/account/edit"
          >
            {t("account.editDetails")}
          </Link>
        </div>
      </div>
    </div>
  );
}
