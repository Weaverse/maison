import { CaretRightIcon, ListIcon, XIcon } from "@phosphor-icons/react";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "~/components/link";
import { ScrollArea } from "~/components/scroll-area";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";
import { cn } from "~/utils/cn";

export function MobileMenu() {
  const { headerMenu } = useShopMenu();

  if (!headerMenu) {
    return <MenuTrigger />;
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger
        asChild
        className="relative flex h-8 w-8 items-center justify-center focus-visible:outline-hidden lg:hidden"
      >
        <MenuTrigger />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-black/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content
          className="fixed inset-0 left-0 z-10 flex h-(--screen-height) flex-col bg-(--color-header-bg) pb-3 pt-3 uppercase focus-visible:outline-hidden data-[state=open]:animate-enter-from-left data-[state=closed]:animate-exit-to-left"
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title asChild>
            <div className="px-4 py-4 font-semibold text-sm">MENU</div>
          </Dialog.Title>
          <Dialog.Close asChild>
            <XIcon className="fixed top-[26px] right-4 h-5 w-5" />
          </Dialog.Close>

          <div className="py-2">
            <ScrollArea className="h-[calc(var(--screen-height)-5rem)]">
              <div className="space-y-1 px-4">
                {headerMenu.items.map((item) => (
                  <CollapsibleMenuItem
                    key={item.id}
                    item={item as unknown as SingleMenuItem}
                    level={0}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
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
            "block py-3 text-sm",
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
              "uppercase text-sm text-left",
              isTopLevel ? "font-semibold" : "font-medium",
            )}
          >
            {title}
          </span>
          <CaretRightIcon className="h-4 w-4" />
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
