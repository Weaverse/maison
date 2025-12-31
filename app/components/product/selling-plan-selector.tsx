import { Money } from "@shopify/hydrogen";
import clsx from "clsx";
import { useLocation, useNavigate } from "react-router";
import type { SellingPlanGroupFragment } from "storefront-api.generated";

interface SellingPlanSelectorProps {
  sellingPlanGroups: {
    nodes: SellingPlanGroupFragment[];
  };
  selectedSellingPlanId: string | null;
}

export function SellingPlanSelector({
  sellingPlanGroups,
  selectedSellingPlanId,
}: SellingPlanSelectorProps) {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  const availableGroups =
    sellingPlanGroups?.nodes?.filter(
      (group) => group.sellingPlans.nodes.length > 0,
    ) || [];

  if (!availableGroups.length) {
    return null;
  }

  const handleSellingPlanChange = (sellingPlanId: string | null) => {
    const params = new URLSearchParams(search);
    if (sellingPlanId) {
      params.set("selling_plan", sellingPlanId);
    } else {
      params.delete("selling_plan");
    }
    navigate(`${pathname}?${params.toString()}`, { replace: true });
  };

  return (
    <div className="space-y-3">
      {/* One-time purchase option */}
      <label
        className={clsx(
          "flex items-center gap-3 cursor-pointer p-4 border rounded-sm transition-all relative",
          selectedSellingPlanId
            ? "border-line hover:border-body"
            : "border-black bg-body/5 shadow-[0_0_0_1px_black]",
        )}
      >
        <div className="flex items-center h-5">
          <input
            type="radio"
            name="selling_plan"
            checked={!selectedSellingPlanId}
            onChange={() => handleSellingPlanChange(null)}
            className="h-4 w-4 border-line text-black focus:ring-black accent-black cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium d-block text-body">
            One-time purchase
          </span>
        </div>
      </label>

      {/* Subscription options */}
      {availableGroups.map((group) => (
        <div key={group.name} className="space-y-3">
          <p className="text-xs uppercase tracking-wider font-bold text-body-subtle pt-2">
            {group.name}
          </p>
          <div className="space-y-3">
            {group.sellingPlans.nodes.map((plan) => {
              const priceAdjustment = plan.priceAdjustments?.[0];
              const adjustmentValue = priceAdjustment?.adjustmentValue;

              let discountText = "";
              if (adjustmentValue) {
                if ("adjustmentPercentage" in adjustmentValue) {
                  discountText = `Save ${adjustmentValue.adjustmentPercentage}%`;
                } else if (
                  "adjustmentAmount" in adjustmentValue &&
                  adjustmentValue.adjustmentAmount
                ) {
                  discountText = "Save ";
                }
              }

              const isSelected = selectedSellingPlanId === plan.id;

              return (
                <label
                  key={plan.id}
                  className={clsx(
                    "flex items-center gap-3 cursor-pointer p-4 border rounded-sm transition-all relative",
                    isSelected
                      ? "border-black bg-body/5 shadow-[0_0_0_1px_black]"
                      : "border-line hover:border-body",
                  )}
                >
                  <input
                    type="radio"
                    name="selling_plan"
                    value={plan.id}
                    checked={isSelected}
                    onChange={() => handleSellingPlanChange(plan.id)}
                    className="h-4 w-4 border-line text-black focus:ring-black accent-black cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={clsx(
                          "text-sm font-medium",
                          isSelected ? "text-body" : "text-body-subtle",
                        )}
                      >
                        {plan.name}
                      </span>

                      {discountText && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 whitespace-nowrap">
                          {discountText}
                          {adjustmentValue &&
                            "adjustmentAmount" in adjustmentValue &&
                            adjustmentValue.adjustmentAmount && (
                              <span className="ml-1">
                                <Money
                                  data={adjustmentValue.adjustmentAmount}
                                />
                              </span>
                            )}
                        </span>
                      )}
                    </div>

                    {plan.description && (
                      <p className="text-xs text-body-subtle mt-1 leading-relaxed">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
