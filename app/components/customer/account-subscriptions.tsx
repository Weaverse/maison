import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router";

interface AccountSubscriptionsProps {
  className?: string;
}

export function AccountSubscriptions({ className }: AccountSubscriptionsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="font-bold">Subscriptions</div>
        <Link
          to="/account/subscriptions"
          className="flex items-center gap-1 text-sm text-body-subtle hover:text-body transition-colors"
        >
          Manage subscriptions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <p>
        View and manage your recurring subscription orders.
      </p>
    </div>
  );
}
