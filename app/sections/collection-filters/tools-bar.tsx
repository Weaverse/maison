import { SlidersIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useLoaderData } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { Button } from "~/components/button";
import { ScrollArea } from "~/components/scroll-area";
import { cn } from "~/utils/cn";
import { Filters } from "./filters";
import { Sort } from "./sort";

interface ToolsBarProps {
  enableSort: boolean;
  showProductsCount: boolean;
  enableFilter: boolean;
  filtersPosition: "sidebar" | "drawer";
  expandFilters: boolean;
  showFiltersCount: boolean;
}

export function ToolsBar({
  enableSort,
  enableFilter,
  filtersPosition,
  showProductsCount,
}: ToolsBarProps) {
  const { collection } = useLoaderData<CollectionQuery>();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[37px]">{collection?.title}</h4>
        {enableFilter && (
          <div className="hidden md:block">
            <FiltersDrawer filtersPosition={filtersPosition} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-sm">
        {enableFilter && (
          <div className="md:hidden">
            <FiltersDrawer filtersPosition={filtersPosition} />
          </div>
        )}
        {showProductsCount && (
          <span className="hidden md:block">
            Products ({collection?.products.nodes.length})
          </span>
        )}
        {enableSort && <Sort />}
      </div>
    </div>
  );
}

function FiltersDrawer({
  filtersPosition,
}: {
  filtersPosition: ToolsBarProps["filtersPosition"];
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex h-12 items-center gap-1.5 border py-2",
            filtersPosition === "sidebar" && "lg:hidden",
          )}
          animate={false}
        >
          <SlidersIcon size={18} />
          <span>Filter</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-10 bg-black/50 data-[state=open]:animate-fade-in"
          style={{ "--fade-in-duration": "100ms" } as React.CSSProperties}
        />
        <Dialog.Content
          className={clsx([
            "fixed inset-y-0 z-10 w-full bg-(--color-background) md:w-[360px]",
            "translate-x-full right-0 data-[state=open]:translate-x-0 data-[state=open]:animate-enter-from-right",
            "flex flex-col",
          ])}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between gap-2 px-5 py-3">
            <Dialog.Title asChild className="pt-2.5 font-bold">
              <span>Filters</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="translate-x-2 p-2"
                aria-label="Close filters drawer"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <ScrollArea className="flex-1" size="sm">
            <Filters className="px-5" />
          </ScrollArea>
          <div className="mt-auto border-line-subtle border-t px-5 py-4 md:hidden">
            <Dialog.Close asChild>
              <Button className="w-full" variant="primary">
                Apply Filters
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
