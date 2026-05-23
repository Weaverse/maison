import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  type CartReturn,
  useAnalytics,
  useOptimisticCart,
} from "@shopify/hydrogen";
import type { CartCost } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useState } from "react";
import { Await, useRouteLoaderData } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Cart } from "~/components/cart/cart";
import { FreeShippingProgressBar } from "~/components/cart/free-shipping-progress-bar";
import Link from "~/components/link";
import type { RootLoader } from "~/root";

export let toggleCartDrawer = (_open: boolean) => {
  /* */
};

export function CartDrawer() {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const [open, setOpen] = useState(false);
  toggleCartDrawer = setOpen;

  return (
    <Suspense
      fallback={
        <Link
          to="/cart"
          className="relative flex h-8 w-8 items-center justify-center focus:ring-border"
        >
          <ShoppingBagIcon className="h-5 w-5" />
        </Link>
      }
    >
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <CartDrawerContent
            originalCart={cart as CartApiQueryFragment | null}
            open={open}
            setOpen={setOpen}
          />
        )}
      </Await>
    </Suspense>
  );
}

function CartDrawerContent({
  originalCart,
  open,
  setOpen,
}: {
  originalCart: CartApiQueryFragment | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { publish } = useAnalytics();
  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        onClick={() => publish("custom_sidecart_viewed", { cart })}
        className="relative flex h-8 w-8 items-center justify-center focus:ring-border"
      >
        <ShoppingBagIcon className="h-5 w-5" />
        {cart?.totalQuantity > 0 && (
          <div
            className={clsx(
              "cart-count",
              "absolute top-0 left-6.5",
              "flex items-center",
              "text-xs leading-none font-medium",
            )}
          >
            <span>{cart.totalQuantity > 99 ? "99+" : cart.totalQuantity}</span>
          </div>
        )}
      </Dialog.Trigger>
      <AnimatedDrawer open={open}>
        <div className="flex h-full flex-col space-y-6">
          <div className="flex items-center justify-between gap-2 px-5">
            <Dialog.Title asChild className="text-base">
              <span className="font-bold">Cart</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="translate-x-2 p-2"
                aria-label="Close cart drawer"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          {cart?.totalQuantity > 0 && (
            <FreeShippingProgressBar
              cost={cart?.cost as CartCost}
              className="px-5"
            />
          )}
          <Cart layout="drawer" cart={cart as CartReturn} />
        </div>
      </AnimatedDrawer>
    </Dialog.Root>
  );
}

function AnimatedDrawer({ open, children }) {
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
                className="w-screen max-w-[461px] bg-background pt-3 h-full relative"
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
