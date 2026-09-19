import {
  flattenConnection,
  getPaginationVariables,
  Money,
  Pagination,
} from "@shopify/hydrogen";
import { useTranslation } from "@weaverse/hydrogen";
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from "customer-account-api.generated";
import type * as React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, type MetaFunction, useLoaderData } from "react-router";

// https://shopify.dev/docs/api/customer/latest/objects/Order
const ORDER_ITEM_FRAGMENT = `#graphql
  fragment OrderItem on Order {
    totalPrice {
      amount
      currencyCode
    }
    financialStatus
    fulfillments(first: 1) {
      nodes {
        status
      }
    }
    id
    number
    processedAt
  }
` as const;

// https://shopify.dev/docs/api/customer/latest/objects/Customer
const CUSTOMER_ORDERS_FRAGMENT = `#graphql
  fragment CustomerOrders on Customer {
    orders(
      sortKey: PROCESSED_AT,
      reverse: true,
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...OrderItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
` as const;

// https://shopify.dev/docs/api/customer/latest/queries/customer
const CUSTOMER_ORDERS_QUERY = `#graphql
  ${CUSTOMER_ORDERS_FRAGMENT}
  query CustomerOrders(
    $endCursor: String
    $first: Int
    $last: Int
    $startCursor: String
  ) {
    customer {
      ...CustomerOrders
    }
  }
` as const;

export const meta: MetaFunction = () => {
  return [{ title: "Orders" }];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const { data, errors } = await context.customerAccount.query(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: {
        ...paginationVariables,
      },
    },
  );

  if (errors?.length || !data?.customer) {
    throw new Error("Customer orders not found");
  }

  return { customer: data.customer };
}

export default function Orders() {
  const { t } = useTranslation();
  const { customer } = useLoaderData<{ customer: CustomerOrdersFragment }>();
  const { orders } = customer;
  return (
    <div className="orders">
      {orders.nodes.length ? (
        <div className="account-orders">
          <PaginatedOrders connection={orders}>
            {({ node: order }) => <OrderItem key={order.id} order={order} />}
          </PaginatedOrders>
        </div>
      ) : (
        <div>
          <p>{t("account.noOrders")}</p>
          <br />
          <p>
            <Link to="/collections">{t("account.startShopping")} →</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function PaginatedOrders<NodesType>({
  connection,
  children,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>["connection"];
  children: (props: { node: NodesType; index: number }) => React.ReactNode;
  resourcesClassName?: string;
}) {
  const { t } = useTranslation();

  return (
    <Pagination connection={connection}>
      {({ nodes, isLoading, PreviousLink, NextLink }) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({ node, index }),
        );

        return (
          <div>
            <PreviousLink>
              {isLoading ? (
                t("account.loading")
              ) : (
                <span>↑ {t("account.loadPrevious")}</span>
              )}
            </PreviousLink>
            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              resourcesMarkup
            )}
            <NextLink>
              {isLoading ? (
                t("account.loading")
              ) : (
                <span>{t("account.loadMore")} ↓</span>
              )}
            </NextLink>
          </div>
        );
      }}
    </Pagination>
  );
}

function OrderItem({ order }: { order: OrderItemFragment }) {
  const { t } = useTranslation();
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <>
      <fieldset>
        <Link to={`/account/orders/${btoa(order.id)}`}>
          <strong>#{order.number}</strong>
        </Link>
        <p>{new Date(order.processedAt).toDateString()}</p>
        <p>{order.financialStatus}</p>
        {fulfillmentStatus && <p>{fulfillmentStatus}</p>}
        <Money data={order.totalPrice} />
        <Link to={`/account/orders/${btoa(order.id)}`}>
          {t("account.viewOrder")} →
        </Link>
      </fieldset>
      <br />
    </>
  );
}
