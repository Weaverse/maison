import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { useThemeSettings } from "@weaverse/hydrogen";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { RevealUnderline } from "~/components/reveal-underline";
import { ScrollArea } from "~/components/scroll-area";
import { usePredictiveSearch } from "~/hooks/use-predictive-search";
import type { NormalizedPredictiveSearchResultItem } from "~/types/predictive-search";
import { cn } from "~/utils/cn";
import { PredictiveSearchForm } from "./search-form";

export let toggleSearchDrawer = (_open: boolean) => {
  /* */
};

export function PredictiveSearchButton() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const params = useParams();

  toggleSearchDrawer = setOpen;

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the dialog when the location changes, aka when the user navigates to a search result page
  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        asChild
        className="hidden h-8 w-8 items-center justify-center focus-visible:outline-hidden lg:flex"
      >
        <button type="button">
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
      </Dialog.Trigger>
      <AnimatedSearchDrawer open={open}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 px-5 pb-6">
            <Dialog.Title asChild className="text-base">
              <span className="font-medium">Search</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-2"
                aria-label="Close search drawer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-hidden">
            <PredictiveSearchForm>
              {({ fetchResults, inputRef }) => (
                <SearchContent
                  fetchResults={fetchResults}
                  inputRef={inputRef}
                  params={params}
                />
              )}
            </PredictiveSearchForm>
          </div>
        </div>
      </AnimatedSearchDrawer>
    </Dialog.Root>
  );
}

function AnimatedSearchDrawer({ open, children }) {
  return (
    <Dialog.Portal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <Dialog.Overlay forceMount>
              <motion.div
                className="fixed inset-0 z-10 bg-black/50 backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="fixed inset-y-0 right-0 z-10"
              aria-describedby={undefined}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 150,
                }}
                className="w-screen md:max-w-[384px] bg-background py-4 h-full"
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </>
        )}
      </AnimatePresence>
    </Dialog.Portal>
  );
}

function SearchContent({ fetchResults, inputRef, params }) {
  const { results } = usePredictiveSearch();
  const queries = results?.find(({ type }) => type === "queries");
  const suggestions = queries?.items || [];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4">
        <div className="flex items-center gap-3 rounded-lg border border-line-subtle bg-[#F2F0EE] px-4">
          <MagnifyingGlassIcon className="h-4 w-4 shrink-0" />
          <input
            name="q"
            type="search"
            onChange={(e) => fetchResults(e.target.value)}
            onFocus={(e) => fetchResults(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const query = e.currentTarget.value.trim();
                if (query) {
                  const locale = params.locale ? `/${params.locale}` : "";
                  window.location.href = `${locale}/search?q=${encodeURIComponent(query)}`;
                }
              }
            }}
            placeholder="Search"
            ref={inputRef}
            autoComplete="off"
            className="h-full w-full bg-transparent py-3 text-sm focus-visible:outline-hidden"
          />
          {inputRef.current?.value && (
            <button
              type="button"
              className="shrink-0 p-1 text-gray-400 hover:text-gray-600"
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.value = "";
                  fetchResults("");
                }
              }}
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <KeywordsDisplay
          suggestions={suggestions}
          onKeywordClick={(keyword) => {
            if (inputRef.current) {
              inputRef.current.value = keyword;
              fetchResults(keyword);
            }
          }}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <PredictiveSearchResults />
      </div>
    </div>
  );
}

function PredictiveSearchResults() {
  const { results, totalResults, searchTerm } = usePredictiveSearch();
  const [activeTab, setActiveTab] = useState("products");
  const params = useParams();

  const products = results?.find(({ type }) => type === "products");
  const collections = results?.find(({ type }) => type === "collections");
  const pages = results?.find(({ type }) => type === "articles");
  // console.log("🚀 ~ PredictiveSearchResults ~ results:", results);
  // console.log("🚀 ~ PredictiveSearchResults ~ collections:", collections);
  // console.log("🚀 ~ PredictiveSearchResults ~ pages:", pages);

  if (!searchTerm.current) {
    return null;
  }

  if (!totalResults) {
    return (
      <div className="flex items-center justify-center px-5 py-8">
        <p className="text-sm text-gray-500">
          No results found for <q>{searchTerm.current}</q>
        </p>
      </div>
    );
  }

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <Tabs.List className="flex gap-8 border-b border-line-subtle px-5">
        <Tabs.Trigger
          value="products"
          className={cn(
            "pb-3 text-sm font-medium transition-colors",
            activeTab === "products"
              ? "shadow-[0_1px_0_var(--color-line)]"
              : "text-body-subtle/70 hover:text-body-subtle",
          )}
        >
          Products
        </Tabs.Trigger>
        <Tabs.Trigger
          value="collections"
          className={cn(
            "pb-3 text-sm font-medium transition-colors",
            activeTab === "collections"
              ? "shadow-[0_1px_0_var(--color-line)]"
              : "text-body-subtle/70 hover:text-body-subtle",
          )}
        >
          Collections
        </Tabs.Trigger>
        <Tabs.Trigger
          value="pages"
          className={cn(
            "pb-3 text-sm font-medium transition-colors",
            activeTab === "pages"
              ? "shadow-[0_1px_0_var(--color-line)]"
              : "text-body-subtle/70 hover:text-body-subtle",
          )}
        >
          Page
        </Tabs.Trigger>
      </Tabs.List>

      <ScrollArea className="h-full">
        <Tabs.Content value="products" className="p-5">
          {products?.items && products.items.length > 0 ? (
            <div className="space-y-2.5">
              {products.items.map((item) => (
                <ProductResultItem key={item.id} item={item} />
              ))}
              <Link
                to={`${params.locale ? `/${params.locale}` : ""}/search?q=${searchTerm.current}`}
                className="mt-6 block w-full rounded-sm bg-(--btn-secondary-bg) py-3 text-center text-sm font-medium transition-colors"
              >
                See All Results
              </Link>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              No products found
            </p>
          )}
        </Tabs.Content>

        <Tabs.Content value="collections" className="px-5 py-4">
          {collections?.items && collections.items.length > 0 ? (
            <div className="space-y-4">
              {collections.items.map((item) => (
                <CollectionResultItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              No collections found
            </p>
          )}
        </Tabs.Content>

        <Tabs.Content value="pages" className="p-5">
          {pages?.items && pages.items.length > 0 ? (
            <div>
              {pages.items.map((item) => (
                <PageResultItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              No pages found
            </p>
          )}
        </Tabs.Content>
      </ScrollArea>
    </Tabs.Root>
  );
}

function ProductResultItem({
  item,
}: {
  item: NormalizedPredictiveSearchResultItem;
}) {
  if (item.__typename !== "Product") {
    return null;
  }

  return (
    <Link
      to={item.url}
      className="flex gap-4 rounded-lg transition-colors hover:bg-gray-50"
    >
      {item.image && (
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-gray-100">
          <Image
            src={item.image.url}
            alt={item.image.altText || item.title}
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center gap-2">
        <h3 className="text-sm font-semibold">{item.title}</h3>
        {item.price && <p className="text-sm">${item.price.amount}</p>}
        {item.compareAtPrice && (
          <p className="text-xs text-gray-500 line-through">
            ${item.compareAtPrice.amount}
          </p>
        )}
        <p className="flex items-center gap-1 text-xs text-green-600">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
          In Stock
        </p>
      </div>
    </Link>
  );
}

function CollectionResultItem({
  item,
}: {
  item: NormalizedPredictiveSearchResultItem;
}) {
  if (item.__typename !== "Collection") {
    return null;
  }

  return (
    <Link
      to={item.url}
      className="flex flex-col gap-3 transition-colors hover:bg-gray-50"
    >
      {item.image && (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={item.image.url}
            alt={item.image.altText || item.title}
            width={400}
            height={225}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <h3 className="text-sm">{item.title}</h3>
    </Link>
  );
}

function PageResultItem({
  item,
}: {
  item: NormalizedPredictiveSearchResultItem;
}) {
  if (item.__typename !== "Article") {
    return null;
  }

  return (
    <Link to={item.url} className="block rounded-lg py-2 transition-colors">
      <RevealUnderline className="text-sm">{item.title}</RevealUnderline>
    </Link>
  );
}

function KeywordsDisplay({
  suggestions,
  onKeywordClick,
}: {
  suggestions: NormalizedPredictiveSearchResultItem[];
  onKeywordClick: (keyword: string) => void;
}) {
  const { popularSearchKeywords } = useThemeSettings();
  const popularKeywords: string[] =
    popularSearchKeywords
      ?.split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0) || [];
  const keywords =
    suggestions.length > 0
      ? suggestions
      : popularKeywords.map((keyword) => ({
        title: keyword,
        styledTitle: keyword,
      }));

  if (keywords.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {keywords.map((item) => (
        <button
          key={item.title}
          type="button"
          onClick={() => onKeywordClick(item.title)}
          className="text-sm"
        >
          <RevealUnderline>
            <span
              dangerouslySetInnerHTML={{
                __html: item.styledTitle || item.title,
              }}
            />
          </RevealUnderline>
        </button>
      ))}
    </div>
  );
}
