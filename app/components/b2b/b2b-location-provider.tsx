import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import type { CustomerCompany } from "~/graphql/customer-locations-query.account";

export type B2BLocationContextValue = {
  company?: CustomerCompany;
  companyLocationId?: string;
  modalOpen?: boolean;
  setModalOpen: (b: boolean) => void;
};

const defaultB2BLocationContextValue = {
  company: undefined,
  companyLocationId: undefined,
  modalOpen: undefined,
  setModalOpen: () => {
    // Default implementation
  },
};

const B2BLocationContext = createContext<B2BLocationContextValue>(
  defaultB2BLocationContextValue,
);

export function B2BLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetcher = useFetcher<B2BLocationContextValue>();
  const [modalOpen, setModalOpen] = useState(fetcher?.data?.modalOpen);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetcher.load is stable but fetcher is not
  useEffect(() => {
    console.log(
      "🚀 ~ B2BLocationProvider ~ fetcher:",
      fetcher.data,
      fetcher.state,
    );
    if (fetcher.data || fetcher.state === "loading") {
      return;
    }

    fetcher.load("/b2blocations");
  }, [fetcher.data, fetcher.state]);

  const value = useMemo<B2BLocationContextValue>(() => {
    return {
      ...defaultB2BLocationContextValue,
      ...fetcher.data,
      modalOpen: modalOpen ?? fetcher?.data?.modalOpen,
      setModalOpen,
    };
  }, [fetcher, modalOpen]);
  return (
    <B2BLocationContext.Provider value={value}>
      {children}
    </B2BLocationContext.Provider>
  );
}

export function useB2BLocation(): B2BLocationContextValue {
  return useContext(B2BLocationContext);
}
