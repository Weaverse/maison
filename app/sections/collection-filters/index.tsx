import { createSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useLoaderData } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { BreadCrumb } from "~/components/breadcrumb";
import { Image } from "~/components/image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import { Filters } from "./filters";
import { ProductsPagination } from "./products-pagination";
import { ToolsBar } from "./tools-bar";

export interface CollectionFiltersData {
  showBreadcrumb: boolean;
  showDescription: boolean;
  showBanner: boolean;
  bannerHeightDesktop: number;
  bannerHeightMobile: number;
  bannerBorderRadius: number;
  enableSort: boolean;
  showProductsCount: boolean;
  enableFilter: boolean;
  filtersPosition: "sidebar" | "drawer";
  expandFilters: boolean;
  showFiltersCount: boolean;
  enableSwatches: boolean;
  displayAsButtonFor: string;
  productsPerRowDesktop: number;
  productsPerRowMobile: number;
  loadPrevText: string;
  loadMoreText: string;
}

interface CollectionFiltersProps extends SectionProps, CollectionFiltersData {
  ref: React.Ref<HTMLElement>;
}

export default function CollectionFilters(props: CollectionFiltersProps) {
  const {
    ref,
    showBreadcrumb,
    showDescription,
    showBanner,
    bannerHeightDesktop,
    bannerHeightMobile,
    bannerBorderRadius,
    enableSort,
    showFiltersCount,
    enableFilter,
    filtersPosition,
    expandFilters,
    showProductsCount,
    enableSwatches,
    displayAsButtonFor,
    productsPerRowDesktop,
    productsPerRowMobile,
    loadPrevText,
    loadMoreText,
    ...rest
  } = props;

  const { collection, collections } = useLoaderData<
    CollectionQuery & {
      collections: Array<{ handle: string; title: string }>;
    }
  >();

  const gridSizeDesktop = Number(productsPerRowDesktop) || 3;
  const gridSizeMobile = Number(productsPerRowMobile) || 1;

  if (collection?.products && collections) {
    const banner = collection.metafield
      ? collection.metafield.reference.image
      : collection.image;
    return (
      <Section ref={ref} {...rest} overflow="unset">
        {showBreadcrumb && (
          <BreadCrumb page={collection.title} className="mb-2.5" />
        )}
        {showDescription && collection.description && (
          <p className="mt-2.5 text-body-subtle">{collection.description}</p>
        )}
        {showBanner && banner && (
          <div
            className={clsx([
              "mt-6 overflow-hidden bg-gray-100",
              "rounded-(--banner-border-radius)",
              "h-(--banner-height-mobile) lg:h-(--banner-height-desktop)",
            ])}
            style={
              {
                "--banner-height-desktop": `${bannerHeightDesktop}px`,
                "--banner-height-mobile": `${bannerHeightMobile}px`,
                "--banner-border-radius": `${bannerBorderRadius}px`,
              } as React.CSSProperties
            }
          >
            <Image data={banner} sizes="auto" width={2000} />
          </div>
        )}
        <ToolsBar {...props} />
        <div className="flex gap-5 pt-6 pb-8 lg:pt-12 lg:pb-20">
          {enableFilter && filtersPosition === "sidebar" && (
            <div className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-[calc(var(--height-nav)+40px)] space-y-4">
                <div className="font-bold">Filters</div>
                <Filters />
              </div>
            </div>
          )}
          <ProductsPagination
            gridSizeDesktop={gridSizeDesktop}
            gridSizeMobile={gridSizeMobile}
            loadPrevText={loadPrevText}
            loadMoreText={loadMoreText}
          />
        </div>
      </Section>
    );
  }
  return <Section ref={ref} {...rest} />;
}

export const schema = createSchema({
  type: "collection-filters",
  title: "Collection filters",
  limit: 1,
  enabledOn: {
    pages: ["COLLECTION"],
  },
  settings: [
    {
      group: "Layout",
      inputs: [
        ...layoutInputs.filter((inp) => {
          return inp.name !== "borderRadius" && inp.name !== "gap";
        }),
        {
          type: "switch",
          name: "showBreadcrumb",
          label: "Show breadcrumb",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showDescription",
          label: "Show description",
          defaultValue: false,
        },
      ],
    },
    {
      group: "Banner",
      inputs: [
        {
          type: "switch",
          name: "showBanner",
          label: "Show banner",
          defaultValue: true,
          helpText:
            "A custom banner can be stored under `custom.collection_banner` metafield.",
        },
        {
          type: "range",
          name: "bannerHeightDesktop",
          label: "Banner height (desktop)",
          defaultValue: 350,
          configs: {
            min: 100,
            max: 600,
            step: 1,
          },
          condition: (data: CollectionFiltersData) => data.showBanner,
        },
        {
          type: "range",
          name: "bannerHeightMobile",
          label: "Banner height (mobile)",
          defaultValue: 200,
          configs: {
            min: 50,
            max: 400,
            step: 1,
          },
          condition: (data: CollectionFiltersData) => data.showBanner,
        },
        {
          type: "range",
          name: "bannerBorderRadius",
          label: "Banner border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
          condition: (data: CollectionFiltersData) => data.showBanner,
        },
      ],
    },
    {
      group: "Filtering and sorting",
      inputs: [
        {
          type: "switch",
          name: "enableSort",
          label: "Enable sorting",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showProductsCount",
          label: "Show products count",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "enableFilter",
          label: "Enable filtering",
          defaultValue: true,
        },
        {
          type: "select",
          name: "filtersPosition",
          label: "Filters position",
          configs: {
            options: [
              { value: "sidebar", label: "Sidebar" },
              { value: "drawer", label: "Drawer" },
            ],
          },
          defaultValue: "sidebar",
          condition: (data: CollectionFiltersData) => data.enableFilter,
        },
        {
          type: "switch",
          name: "expandFilters",
          label: "Expand filters",
          defaultValue: true,
          condition: (data: CollectionFiltersData) => data.enableFilter,
        },
        {
          type: "switch",
          name: "showFiltersCount",
          label: "Show filters count",
          defaultValue: true,
          condition: (data: CollectionFiltersData) => data.enableFilter,
        },
        {
          type: "switch",
          name: "enableSwatches",
          label: "Enable color/image swatches",
          defaultValue: true,
          condition: (data: CollectionFiltersData) => data.enableFilter,
        },
        {
          type: "text",
          name: "displayAsButtonFor",
          label: "Display as button for:",
          defaultValue: "Size, More filters",
          condition: (data: CollectionFiltersData) => data.enableFilter,
          helpText: "Comma-separated list of filters to display as buttons",
        },
      ],
    },
    {
      group: "Products grid",
      inputs: [
        {
          type: "toggle-group",
          name: "productsPerRowDesktop",
          label: "Default products per row (desktop)",
          configs: {
            options: [
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
            ],
          },
          defaultValue: "3",
        },
        {
          type: "toggle-group",
          name: "productsPerRowMobile",
          label: "Default products per row (mobile)",
          configs: {
            options: [
              { value: "1", label: "1" },
              { value: "2", label: "2" },
            ],
          },
          defaultValue: "1",
        },
        {
          type: "text",
          name: "loadPrevText",
          label: "Load previous text",
          defaultValue: "↑ Load previous",
          placeholder: "↑ Load previous",
        },
        {
          type: "text",
          name: "loadMoreText",
          label: "Load more text",
          defaultValue: "Load more ↓",
          placeholder: "Load more ↓",
        },
      ],
    },
  ],
});
