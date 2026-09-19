import { CaretDownIcon } from "@phosphor-icons/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "@weaverse/hydrogen";
import { useLocation, useSearchParams } from "react-router";
import Link from "~/components/link";
import { cn } from "~/utils/cn";
import { clearPaginationParams, type SortParam } from "~/utils/filter";

// Labels live as catalogue keys because this array sits outside the
// component, where the translation hook is not available.
const SORT_LIST: { labelKey: string; key: SortParam }[] = [
  { labelKey: "sort.featured", key: "featured" },
  {
    labelKey: "sort.relevance",
    key: "relevance",
  },
  {
    labelKey: "sort.priceLowHigh",
    key: "price-low-high",
  },
  {
    labelKey: "sort.priceHighLow",
    key: "price-high-low",
  },
  {
    labelKey: "sort.bestSelling",
    key: "best-selling",
  },
  {
    labelKey: "sort.newest",
    key: "newest",
  },
];

export function Sort() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const currentSort =
    SORT_LIST.find(({ key }) => key === searchParams.get("sort")) ||
    SORT_LIST[0];
  const params = new URLSearchParams(searchParams);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex h-12 items-center gap-1.5 py-3 text-sm focus-visible:outline-hidden">
        <span>
          {t("collection.sortBy")}{" "}
          <span className="font-semibold">{t(currentSort.labelKey)}</span>
        </span>
        <CaretDownIcon />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className={cn(
            "z-50 flex h-fit w-60 flex-col items-start gap-4 rounded border border-line-subtle bg-background p-6 text-left text-sm leading-[1.6] tracking-[0.28px] uppercase",
            "data-[state=open]:animate-scale-in",
            "data-[state=closed]:animate-scale-out",
          )}
          style={
            {
              transformOrigin:
                "var(--radix-dropdown-menu-content-transform-origin)",
            } as React.CSSProperties
          }
        >
          {SORT_LIST.map(({ key, labelKey }) => {
            const sortParams = new URLSearchParams(params);
            sortParams.set("sort", key);
            clearPaginationParams(sortParams);
            return (
              <DropdownMenu.Item key={key} asChild>
                <Link
                  to={`${location.pathname}?${sortParams.toString()}`}
                  className={cn(
                    "font-normal outline-hidden transition-opacity hover:opacity-70 focus-visible:opacity-70",
                    currentSort.key === key && "font-semibold",
                  )}
                  preventScrollReset
                >
                  {t(labelKey)}
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
