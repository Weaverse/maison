import { ArrowLeft, CircleNotchIcon, TagIcon, X } from "@phosphor-icons/react";
import { Image } from "@shopify/hydrogen";
import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
} from "@shopify/remix-oxygen";
import type { SubscriptionsContractsQueryQuery } from "customer-account-api.generated";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { Button } from "~/components/button";
import { Section } from "~/components/section";
import { SUBSCRIPTION_CANCEL_MUTATION } from "~/graphql/customer-account/CustomerSubscriptionsMutations.account";
import { SUBSCRIPTIONS_CONTRACTS_QUERY } from "~/graphql/customer-account/CustomerSubscriptionsQuery.account";
import { routeHeaders } from "~/utils/cache";

export const headers = routeHeaders;

type SubscriptionContract =
  SubscriptionsContractsQueryQuery["customer"]["subscriptionContracts"]["nodes"][number];

interface LoaderData {
  subscriptions: SubscriptionContract[];
}

export async function loader({ context }: LoaderFunctionArgs) {
  const { data: result } = await context.customerAccount.query(
    SUBSCRIPTIONS_CONTRACTS_QUERY,
  );

  const subscriptions = result?.customer?.subscriptionContracts?.nodes || [];

  return { subscriptions };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const subscriptionContractId = formData.get(
    "subscriptionContractId",
  ) as string;

  if (!subscriptionContractId) {
    return data({ error: "Missing subscription ID" }, { status: 400 });
  }

  const { data: result, errors } = await context.customerAccount.mutate(
    SUBSCRIPTION_CANCEL_MUTATION,
    {
      variables: { subscriptionContractId },
    },
  );

  if (
    errors?.length ||
    result?.subscriptionContractCancel?.userErrors?.length
  ) {
    const errorMessage =
      errors?.[0]?.message ||
      result?.subscriptionContractCancel?.userErrors?.[0]?.message ||
      "Failed to cancel subscription";
    return data({ error: errorMessage }, { status: 400 });
  }

  return data({ success: true });
}

function getIntervalLabel(interval: string, count: number): string {
  const intervalLabels: Record<string, string> = {
    DAY: count === 1 ? "day" : "days",
    WEEK: count === 1 ? "week" : "weeks",
    MONTH: count === 1 ? "month" : "months",
    YEAR: count === 1 ? "year" : "years",
  };
  return `${count} ${intervalLabels[interval] || interval.toLowerCase()}`;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PAUSED":
      return "bg-yellow-100 text-yellow-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function AccountSubscriptions() {
  const { subscriptions } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ error?: string; success?: boolean }>();
  const navigation = useNavigation();

  return (
    <Section
      width="fixed"
      verticalPadding="medium"
      containerClassName="space-y-8"
    >
      <div className="flex items-center gap-4">
        <Link
          to="/account"
          className="flex items-center gap-2 text-body-subtle hover:text-body transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Account</span>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="h3 font-medium">My Subscriptions</h1>
        <p className="text-body-subtle">
          Manage your active subscriptions and recurring orders.
        </p>
      </div>

      {actionData?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm">
          {actionData.error}
        </div>
      )}

      {actionData?.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-sm">
          Subscription cancelled successfully.
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="text-center py-24 space-y-6 border border-dashed border-line rounded-lg bg-gray-50">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center border border-line-subtle shadow-sm">
            <CircleNotchIcon className="w-8 h-8 text-body-subtle" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">No active subscriptions</h3>
            <p className="text-body-subtle max-w-md mx-auto">
              You don't have any active subscriptions yet. Subscribe to your
              favorite products to get regular deliveries and savings.
            </p>
          </div>
          <Link to="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="flex flex-col border border-line rounded-lg overflow-hidden bg-background shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-line-subtle bg-gray-50/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-body-subtle font-medium uppercase tracking-wider">
                    Status
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(
                      subscription.status,
                    )}`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-body-subtle font-medium uppercase tracking-wider">
                    Frequency
                  </div>
                  <div className="text-sm font-medium">
                    Every{" "}
                    {getIntervalLabel(
                      subscription.billingPolicy.interval,
                      subscription.billingPolicy.intervalCount.count,
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-6">
                {/* Products */}
                <div className="space-y-3">
                  <h4 className="text-xs text-body-subtle font-medium uppercase tracking-wider">
                    Product
                  </h4>
                  <ul className="space-y-3">
                    {subscription.lines.nodes.map((line) => (
                      <li key={line.id} className="flex items-start gap-3">
                        {line.image ? (
                          <div className="relative border border-line-subtle rounded shrink-0 overflow-hidden w-12 h-12">
                            <Image
                              data={line.image}
                              className="w-full h-full object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded border border-line-subtle shrink-0"></div>
                        )}
                        <span className="text-sm font-medium line-clamp-2 leading-snug">
                          {line.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Details */}
                <div className="pt-2 space-y-3">
                  {subscription.nextBillingDate && (
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-body-subtle">Next Billing</span>
                      <span className="font-semibold">
                        {new Date(
                          subscription.nextBillingDate,
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-body-subtle">Started</span>
                    <span>
                      {new Date(subscription.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </div>

                {subscription.discounts.nodes.length > 0 && (
                  <div className="pt-4 border-t border-line-subtle">
                    <div className="flex flex-wrap gap-2">
                      {subscription.discounts.nodes.map((discount) => (
                        <span
                          key={discount.id}
                          className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded"
                        >
                          <TagIcon className="w-3 h-3 mr-1" />
                          {discount.title}
                          {discount.value.__typename ===
                            "SubscriptionDiscountPercentageValue" &&
                            discount.value.percentage &&
                            ` (-${discount.value.percentage}%)`}
                          {discount.value.__typename ===
                            "SubscriptionDiscountFixedAmountValue" &&
                            discount.value.amount &&
                            ` (-$${discount.value.amount.amount})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              {subscription.status === "ACTIVE" && (
                <div className="p-5 border-t border-line-subtle bg-gray-50/30">
                  <Form method="post">
                    <input
                      type="hidden"
                      name="subscriptionContractId"
                      value={subscription.id}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                      disabled={navigation.state === "submitting"}
                    >
                      {navigation.state === "submitting" ? (
                        <CircleNotchIcon className="h-4 w-4 mr-3 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-3" />
                      )}
                      {navigation.state === "submitting"
                        ? "Cancelling..."
                        : "Cancel Subscription"}
                    </Button>
                  </Form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
