import { CaretDown } from "@phosphor-icons/react";
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
    : "One time purchase";

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-11 flex items-center justify-between gap-4 px-3 text-sm border-2 border-(--color-line) rounded bg-white",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left text-sm">{displayText}</span>
        <CaretDown
          size={16}
          className={cn("shrink-0 transition", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-(--color-line) rounded-[8px] shadow-lg max-h-60 overflow-auto">
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
                One time purchase
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
