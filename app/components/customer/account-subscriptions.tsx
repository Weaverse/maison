import { ArrowRight, Repeat } from "@phosphor-icons/react";
import { Link } from "react-router";

interface AccountSubscriptionsProps {
  className?: string;
}

export function AccountSubscriptions({ className }: AccountSubscriptionsProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
        <h2 className="font-medium text-lg flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Subscriptions
        </h2>
        <Link
          to="/account/subscriptions"
          className="flex items-center gap-1 text-sm text-body-subtle hover:text-body transition-colors"
        >
          Manage subscriptions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <p className="text-sm text-body-subtle">
        View and manage your recurring subscription orders.
      </p>
    </div>
  );
}
