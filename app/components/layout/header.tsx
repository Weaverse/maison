import { MagnifyingGlassIcon, UserIcon } from "@phosphor-icons/react";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { Suspense } from "react";
import {
  Await,
  useLocation,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import useWindowScroll from "react-use/esm/useWindowScroll";
import Link from "~/components/link";
import { Logo } from "~/components/logo";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { DEFAULT_LOCALE } from "~/utils/const";
import { CartDrawer } from "./cart-drawer";
import { DesktopMenu } from "./desktop-menu";
import { MobileMenu } from "./mobile-menu";
import {
  PredictiveSearchButton,
  toggleSearchDrawer,
} from "./predictive-search";

const variants = cva("", {
  variants: {
    width: {
      full: "h-full w-full",
      stretch: "h-full w-full",
      fixed: "mx-auto h-full w-full max-w-(--page-width)",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "mx-auto px-5 md:px-6 lg:px-10",
    },
  },
});

function useIsHomeCheck() {
  const { pathname } = useLocation();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  return pathname.replace(selectedLocale.pathPrefix, "") === "/";
}

export function Header() {
  const { enableTransparentHeader, headerWidth } = useThemeSettings();
  const isHome = useIsHomeCheck();
  const { y } = useWindowScroll();
  const routeError = useRouteError();

  const scrolled = y >= 50;
  const enableTransparent = enableTransparentHeader && isHome && !routeError;
  const isTransparent = enableTransparent && !scrolled;

  return (
    <header
      className={cn(
        "z-10 w-full",
        "transition-all duration-300 ease-in-out",
        "bg-(--color-header-bg) hover:bg-(--color-header-bg)",
        "text-(--color-header-text) hover:text-(--color-header-text)",
        "border-line-subtle border-b",
        variants({ padding: headerWidth }),
        scrolled ? "shadow-header" : "shadow-none",
        enableTransparent
          ? [
              "group/header fixed w-screen",
              "top-(--topbar-height,var(--initial-topbar-height))",
            ]
          : "sticky top-0",
        isTransparent
          ? [
              "border-transparent bg-transparent",
              "text-(--color-transparent-header-text)",
              "[&_.cart-count]:text-(--color-header-text)",
              "[&_.main-logo]:opacity-0 hover:[&_.main-logo]:opacity-100",
              "[&_.transparent-logo]:opacity-100 hover:[&_.transparent-logo]:opacity-0",
            ]
          : [
              "[&_.cart-count]:text-(--color-header-text)",
              "[&_.main-logo]:opacity-100",
              "[&_.transparent-logo]:opacity-0",
            ],
      )}
    >
      <div
        style={{ height: "var(--height-nav)" }}
        className={cn(
          "flex items-center justify-between gap-2 py-1.5 lg:gap-8 lg:py-3",
          variants({ width: headerWidth }),
        )}
      >
        <MobileMenu />
        <button
          type="button"
          className="p-1.5 lg:hidden outline-hidden"
          onClick={() => toggleSearchDrawer(true)}
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
        {/* Left column — grows on mobile so the logo stays centered between
            the menu/search buttons and the actions; a flex-1 rail on desktop
            so the nav sits dead-center of the header. */}
        <div className="flex min-w-0 grow items-center lg:flex-1 lg:justify-start">
          <Logo />
        </div>
        <DesktopMenu />
        <div className="z-1 flex items-center gap-1 lg:flex-1 lg:justify-end">
          <PredictiveSearchButton />
          <AccountLink className="relative flex h-8 w-8 items-center justify-center" />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}

function AccountLink({ className }: { className?: string }) {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const isLoggedIn = rootData?.isLoggedIn;

  return (
    <Link to="/account" className={clsx("transition-none", className)}>
      <Suspense fallback={<UserIcon className="h-5 w-5" />}>
        <Await
          resolve={isLoggedIn}
          errorElement={<UserIcon className="h-5 w-5" />}
        >
          {(loggedIn) =>
            loggedIn ? (
              <UserIcon className="h-5 w-5" />
            ) : (
              <UserIcon className="h-5 w-5" />
            )
          }
        </Await>
      </Suspense>
    </Link>
  );
}
