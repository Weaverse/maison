import { Money } from "@shopify/hydrogen";
import type { CartCost } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";

interface FreeShippingProgressBarProps {
  cost: CartCost;
  className?: string;
}

export function FreeShippingProgressBar({
  cost,
  className,
}: FreeShippingProgressBarProps) {
  const {
    enableFreeShippingProgressBar,
    freeShippingThreshold,
    freeShippingProgressMessage,
    freeShippingSuccessMessage,
  } = useThemeSettings();

  if (!(enableFreeShippingProgressBar && freeShippingThreshold)) {
    return null;
  }

  const subtotalAmount = Number(cost?.subtotalAmount?.amount || 0);
  const currencyCode = cost?.subtotalAmount?.currencyCode || "USD";

  const threshold = Number(freeShippingThreshold);
  const remaining = Math.max(0, threshold - subtotalAmount);
  const progress = Math.min(100, (subtotalAmount / threshold) * 100);
  const hasReachedFreeShipping = remaining <= 0;

  const getMessage = () => {
    if (hasReachedFreeShipping) {
      return (
        freeShippingSuccessMessage ||
        "Congratulations! You've got free shipping!"
      );
    }

    const message =
      freeShippingProgressMessage ||
      "You're {{amount}} away from free shipping!";
    return message;
  };

  const message = getMessage();

  return (
    <div className={clsx("space-y-2", className)}>
      {/* progress bar */}
      <div className="h-[4px] w-full bg-(--color-line-subtle) relative overflow-hidden rounded">
        <div
          className="absolute left-0 top-0 h-full bg-(--color-line) transition-all duration-300 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-sm text-body">
        {hasReachedFreeShipping ? (
          message
        ) : (
          <>
            {message.split("{{amount}}")[0]}
            <span className="font-semibold inline-block">
              <Money
                data={{
                  amount: String(remaining),
                  currencyCode,
                }}
                withoutTrailingZeros
              />
            </span>
            {message.split("{{amount}}")[1]}
          </>
        )}
      </div>
    </div>
  );
}
