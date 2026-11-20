import { XIcon } from "@phosphor-icons/react";
import { useTranslation } from "@weaverse/hydrogen";
import { useLocation, useSearchParams } from "react-router";
import Link from "~/components/link";
import { cn } from "~/utils/cn";
import {
  type AppliedFilter,
  countFilterParams,
  getAppliedFilterLink,
  getClearFiltersLink,
} from "~/utils/filter";

/**
 * The row of chips naming the filters currently in force, each one a link that
 * drops that filter. Shared by the collection page and the search page: both
 * open the same filter drawer, so leaving the row out of one of them hid which
 * filters were on and gave no way to clear them without reopening the drawer.
 */
export function AppliedFilters({
  filters,
  className,
}: {
  filters: AppliedFilter[];
  className?: string;
}) {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const location = useLocation();

  // What the URL asks for, which is not always what Shopify names back. A
  // filter that narrows the results to none is left out of `productFilters`
  // entirely, so no chip can be built for the very filter the reader most
  // needs to undo. Counting the parameters keeps that case visible.
  const filterCount = countFilterParams(params);
  if (!filterCount) {
    return null;
  }
  const allNamed = filters.length === filterCount;

  return (
    // One flat row: the design spaces the label, the chips and the clear
    // link by the same 10px, so the chips no longer sit in a group of
    // their own.
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <span className="px-2 py-1 font-semibold text-body-subtle text-base tracking-[0.28px]">
        {t("collection.filteredBy")}
      </span>
      {filters.map((filter: AppliedFilter) => {
        const { label } = filter;
        return (
          <Link
            key={label}
            to={getAppliedFilterLink(filter, params, location)}
            className="items-center gap-2 rounded-xl border border-line-subtle px-2 py-1.5 text-body-subtle text-base leading-none tracking-[0.28px] hover:border-line"
            variant="custom"
            preventScrollReset
          >
            <span>{label}</span>
            <XIcon className="h-3.5 w-3.5" />
          </Link>
        );
      })}
      {/* Always reachable when a chip cannot be drawn for every filter, so a
          search narrowed to nothing is never a dead end. */}
      {filterCount > 1 || !allNamed ? (
        <Link
          to={getClearFiltersLink(params, location)}
          variant="underline"
          // The rule under the link takes the chips' border colour rather than
          // the body colour the `underline` variant defaults to, so the row
          // reads as one set of controls.
          className="text-body-subtle text-base tracking-[0.28px] after:bg-line-subtle"
          aria-label={t("collection.clearAllLabel")}
          preventScrollReset
        >
          {t("collection.clearAll")}
        </Link>
      ) : null}
    </div>
  );
}
