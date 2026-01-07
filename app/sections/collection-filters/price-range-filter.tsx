// import * as Slider from "@radix-ui/react-slider";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
// import clsx from "clsx";
import { useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { ChevronDown, ChevronUp } from "~/components/icons";
import { FILTER_URL_PREFIX, filterInputToParams } from "~/utils/filter";

export function PriceRangeFilter({
  collection,
}: {
  collection: CollectionQuery["collection"];
}) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const thumbRef = useRef<"from" | "to" | null>(null);

  const { minVariantPrice, maxVariantPrice } = getPricesRange(collection);
  const { min, max } = getPricesFromFilter(params);

  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  function handleIncrementMin() {
    const current = minPrice ?? minVariantPrice;
    const newValue = Math.min(current + 1, maxPrice ?? maxVariantPrice - 1);
    setMinPrice(newValue);
    setTimeout(() => handleFilter(), 0);
  }

  function handleDecrementMin() {
    const current = minPrice ?? minVariantPrice;
    const newValue = Math.max(current - 1, minVariantPrice);
    setMinPrice(newValue);
    setTimeout(() => handleFilter(), 0);
  }

  function handleIncrementMax() {
    const current = maxPrice ?? maxVariantPrice;
    const newValue = Math.min(current + 1, maxVariantPrice);
    setMaxPrice(newValue);
    setTimeout(() => handleFilter(), 0);
  }

  function handleDecrementMax() {
    const current = maxPrice ?? maxVariantPrice;
    const newValue = Math.max(current - 1, minPrice ?? minVariantPrice + 1);
    setMaxPrice(newValue);
    setTimeout(() => handleFilter(), 0);
  }

  function handleFilter() {
    let paramsClone = new URLSearchParams(params);
    if (minPrice === undefined && maxPrice === undefined) {
      paramsClone.delete(`${FILTER_URL_PREFIX}price`);
    } else {
      const price = {
        ...(minPrice === undefined ? {} : { min: minPrice }),
        ...(maxPrice === undefined ? {} : { max: maxPrice }),
      };
      paramsClone = filterInputToParams({ price }, paramsClone);
    }
    if (params.toString() !== paramsClone.toString()) {
      navigate(`${location.pathname}?${paramsClone.toString()}`, {
        preventScrollReset: true,
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Price range slider - commented out as per theme requirements
      <Slider.Root
        min={minVariantPrice}
        max={maxVariantPrice}
        step={1}
        minStepsBetweenThumbs={1}
        value={[minPrice || minVariantPrice, maxPrice || maxVariantPrice]}
        onValueChange={([newMin, newMax]) => {
          if (thumbRef.current) {
            if (thumbRef.current === "from") {
              if (maxPrice === undefined || newMin < maxPrice) {
                setMinPrice(newMin);
              }
            } else if (minPrice === undefined || newMax > minPrice) {
              setMaxPrice(newMax);
            }
          } else {
            setMinPrice(newMin);
            setMaxPrice(newMax);
          }
        }}
        onValueCommit={handleFilter}
        className="relative flex h-4 w-full items-center"
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-gray-200">
          <Slider.Range className="absolute h-full rounded-full bg-(--btn-primary-bg)" />
        </Slider.Track>
        {["from", "to"].map((s: "from" | "to") => (
          <Slider.Thumb
            key={s}
            onPointerUp={() => {
              thumbRef.current = null;
            }}
            onPointerDown={() => {
              thumbRef.current = s;
            }}
            className={clsx(
              "block h-4 w-4 cursor-grab rounded-full bg-(--btn-primary-bg) shadow-md",
              "focus-visible:outline-hidden",
            )}
          />
        ))}
      </Slider.Root>
      */}
      <p className="text-body-subtle mb-4">
        The highest price is ${maxVariantPrice}
      </p>
      <div className="flex items-center gap-1">
        <span className="text-line text-sm">$</span>
        <div className="flex shrink items-center gap-2 rounded-lg border border-line bg-gray-50 px-4">
          <VisuallyHidden.Root asChild>
            <label htmlFor="minPrice" aria-label="Min price">
              Min price
            </label>
          </VisuallyHidden.Root>
          <input
            name="minPrice"
            type="number"
            value={minPrice ?? ""}
            min={minVariantPrice}
            placeholder="From"
            onChange={(e) => {
              const { value } = e.target;
              const newMinPrice = Number.isNaN(Number.parseFloat(value))
                ? undefined
                : Number.parseFloat(value);
              setMinPrice(newMinPrice);
            }}
            onBlur={handleFilter}
            className="w-full bg-transparent py-3.5 text-left focus-visible:outline-hidden"
          />
          <div className="flex flex-col gap-[6px]">
            <button
              type="button"
              onClick={handleIncrementMin}
              className="flex items-center justify-center"
              aria-label="Increase min price"
            >
              <ChevronUp />
            </button>
            <button
              type="button"
              onClick={handleDecrementMin}
              className="flex items-center justify-center"
              aria-label="Decrease min price"
            >
              <ChevronDown />
            </button>
          </div>
        </div>
        <span className="text-line text-sm ml-6">$</span>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-gray-50 px-4">
          <VisuallyHidden.Root asChild>
            <label htmlFor="maxPrice" aria-label="Max price">
              Max price
            </label>
          </VisuallyHidden.Root>
          <input
            name="maxPrice"
            type="number"
            value={maxPrice ?? ""}
            max={maxVariantPrice}
            placeholder="To"
            onChange={(e) => {
              const { value } = e.target;
              const newMaxPrice = Number.isNaN(Number.parseFloat(value))
                ? undefined
                : Number.parseFloat(value);
              setMaxPrice(newMaxPrice);
            }}
            onBlur={handleFilter}
            className="w-full bg-transparent py-3.5 text-left focus-visible:outline-hidden"
          />
          <div className="flex flex-col gap-[6px]">
            <button
              type="button"
              onClick={handleIncrementMax}
              className="flex items-center justify-center"
              aria-label="Increase max price"
            >
              <ChevronUp />
            </button>
            <button
              type="button"
              onClick={handleDecrementMax}
              className="flex items-center justify-center"
              aria-label="Decrease max price"
            >
              <ChevronDown />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPricesRange(collection: CollectionQuery["collection"]) {
  const { highestPriceProduct, lowestPriceProduct } = collection;
  const minVariantPrice =
    lowestPriceProduct.nodes[0]?.priceRange?.minVariantPrice;
  const maxVariantPrice =
    highestPriceProduct.nodes[0]?.priceRange?.maxVariantPrice;
  return {
    minVariantPrice: Number(minVariantPrice?.amount) || 0,
    maxVariantPrice: Number(maxVariantPrice?.amount) || 1000,
  };
}

function getPricesFromFilter(params: URLSearchParams) {
  const priceFilter = params.get(`${FILTER_URL_PREFIX}price`);
  const price = priceFilter
    ? (JSON.parse(priceFilter) as ProductFilter["price"])
    : undefined;
  const min = Number.isNaN(Number(price?.min)) ? undefined : Number(price?.min);
  const max = Number.isNaN(Number(price?.max)) ? undefined : Number(price?.max);
  return { min, max };
}
