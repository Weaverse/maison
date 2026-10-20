import { CaretRightIcon, ListIcon, XIcon } from "@phosphor-icons/react";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "@weaverse/hydrogen";
import Link from "~/components/link";
import { ScrollArea } from "~/components/scroll-area";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";

export function MobileMenu() {
  const { t } = useTranslation();
  const { headerMenu } = useShopMenu();

  if (!headerMenu) {
    return <MenuTrigger />;
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger
        asChild
        className="relative flex h-8 w-8 items-center justify-center focus-visible:outline-hidden xl:hidden"
      >
        <MenuTrigger />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-black/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        {/* Full width on a phone, where the design's 360px frame is the whole
            screen anyway; capped at 360px from `sm` up, so the tablet keeps
            the overlay the design shows beside the panel. `inset-0` used to
            cover everything and left no overlay to see at any size. */}
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-10 flex h-(--screen-height) w-full flex-col sm:max-w-[360px] bg-(--color-header-bg) py-3 uppercase focus-visible:outline-hidden data-[state=open]:animate-enter-from-left data-[state=closed]:animate-exit-to-left"
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex shrink-0 items-center gap-4 px-5">
            <Dialog.Title asChild>
              <span className="flex-1 py-4 font-semibold text-sm tracking-[0.28px]">
                {t("navigation.menu")}
              </span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex items-center"
                aria-label={t("navigation.closeMenu")}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <ScrollArea rootClassName="min-h-0 flex-1" size="sm">
            <div className="flex flex-col gap-2 px-5 pt-2">
              {headerMenu.items.map((item) => (
                <CollapsibleMenuItem
                  key={item.id}
                  item={item as unknown as SingleMenuItem}
                  level={0}
                />
              ))}
            </div>
          </ScrollArea>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CollapsibleMenuItem({
  item,
  level = 0,
}: {
  item: SingleMenuItem;
  level?: number;
}) {
  const { title, to, items } = item;
  const isTopLevel = level === 0;

  if (!items?.length) {
    return (
      <Dialog.Close asChild>
        <Link
          to={to}
          className={cn(
            "block py-3 text-sm tracking-[0.28px]",
            isTopLevel ? "font-semibold" : "font-medium",
          )}
        >
          {title}
        </Link>
      </Dialog.Close>
    );
  }

  return (
    <Collapsible.Root>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className='flex w-full items-center justify-between gap-4 py-3 data-[state="open"]:[&>svg]:rotate-90'
        >
          <span
            className={cn(
              "uppercase text-sm text-left tracking-[0.28px]",
              isTopLevel ? "font-semibold" : "font-medium",
            )}
          >
            {title}
          </span>
          <CaretRightIcon className="h-3.5 w-3.5" />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="flex flex-col border-line-subtle border-l pl-4">
        {items.map((childItem) => (
          <CollapsibleMenuItem
            key={childItem.id}
            item={childItem}
            level={level + 1}
          />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function MenuTrigger(
  props: Dialog.DialogTriggerProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, ...rest } = props;
  return (
    <button ref={ref} type="button" {...rest}>
      <ListIcon className="h-5 w-5" />
    </button>
  );
}
