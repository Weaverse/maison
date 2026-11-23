import { CaretDown } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import { useEffect, useRef, useState } from "react";
import type { SellingPlanGroupFragment } from "storefront-api.generated";
import { cn } from "~/utils/cn";
import {
  formatSellingPlanName,
  getAvailableSellingPlans,
} from "~/utils/selling-plan-utils";

interface PurchaseMethodDropdownProps {
  sellingPlanGroups: { nodes: SellingPlanGroupFragment[] };
  selectedPlanId: string | null;
  onPlanChange: (planId: string | null) => void;
  disabled?: boolean;
}

export function PurchaseMethodDropdown({
  sellingPlanGroups,
  selectedPlanId,
  onPlanChange,
  disabled = false,
}: PurchaseMethodDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availablePlans = getAvailableSellingPlans(sellingPlanGroups);
  const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (planId: string | null) => {
    onPlanChange(planId);
    setIsOpen(false);
  };

  const displayText = selectedPlan
    ? formatSellingPlanName(selectedPlan)
    : t("product.oneTimePurchase");

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-11 flex items-center justify-between gap-4 px-3 text-base border border-(--color-line) rounded-(--btn-border-radius) bg-white",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left text-base">{displayText}</span>
        <CaretDown
          size={16}
          className={cn("shrink-0 transition", isOpen && "rotate-180")}
        />
      </button>

      {/* The panel is wide enough for its own options and never narrower than
          the control it hangs off. The tablet variant table has no
          purchase-method column, so there the control is squeezed into the
          variant cell at around 186px while "Deliver every month, 10% off"
          needs about 220 — and `overflow-auto` let the list slide sideways
          inside the panel rather than fit, which cut the first character off
          every row. The overflow is vertical only now, so a long list still
          scrolls. */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-max min-w-full max-w-[min(20rem,90vw)] bg-white border border-(--color-line) rounded-[8px] shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
          <ul className="py-1">
            {/* One-time purchase option */}
            <li>
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  "w-full text-left px-3 py-3.5 text-[14px] hover:bg-gray-100 transition",
                  !selectedPlanId && "bg-gray-50 font-medium",
                )}
                role="option"
                aria-selected={!selectedPlanId}
              >
                {t("product.oneTimePurchase")}
              </button>
            </li>

            {/* Divider */}
            {availablePlans.length > 0 && (
              <li className="border-t border-(--color-line) my-1" />
            )}

            {/* Subscription options */}
            {availablePlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;

              return (
                <li key={plan.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(plan.id)}
                    className={cn(
                      "w-full text-left px-3 py-3.5 text-[14px] hover:bg-gray-100 transition",
                      isSelected && "bg-gray-50 font-medium",
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="truncate">
                      {formatSellingPlanName(plan)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
