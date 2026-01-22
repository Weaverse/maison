import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { CartForm } from "@shopify/hydrogen";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Banner } from "~/components/banner";
import { Button } from "~/components/button";
import { cn } from "~/utils/cn";

export function NoteDialog({
  cartNote: currentNote,
  layout = "drawer",
}: {
  cartNote: string;
  layout?: "page" | "drawer";
}) {
  const [note, setNote] = useState(currentNote);
  const [submitted, setSubmitted] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setSubmitted(true);
    }
  }, [fetcher]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formCartNote = formData.get("cartNote") as string;
    if (formCartNote) {
      fetcher.submit(
        {
          [CartForm.INPUT_NAME]: JSON.stringify({
            action: CartForm.ACTIONS.NoteUpdate,
            inputs: { cartNote: formCartNote },
          }),
        },
        { method: "POST", action: "/cart" },
      );
      setNote(formCartNote);
    }
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <Dialog.Content
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          setNote(currentNote);
          setSubmitted(false);
        }}
        className={cn(
          "fixed z-50 w-full overflow-hidden",
          "bg-white p-6 shadow-xl",
          "data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down",
          layout === "drawer"
            ? "max-w-[461px] bottom-0 right-0 [--slide-up-from:100%] [--slide-down-duration:300ms] [--slide-down-to:100%]"
            : "max-w-[400px] md:max-w-[461px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [--slide-up-from:40px] [--slide-down-to:40px]",
        )}
        aria-describedby={undefined}
      >
        <Dialog.Close asChild>
          <button
            type="button"
            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </Dialog.Close>

        <Dialog.Title className="mb-4 font-medium text-sm">
          Order Note
        </Dialog.Title>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <textarea
            className="min-h-[92px] w-full resize-none p-3 border border-line-subtle rounded-lg"
            placeholder="Order special instructions"
            rows={3}
            name="cartNote"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSubmitted(false);
            }}
          />
          {submitted && (
            <Banner variant="success">Cart note saved successfully 🎉</Banner>
          )}
          <Button
            type="submit"
            loading={fetcher.state !== "idle"}
            disabled={fetcher.state !== "idle"}
            className="w-full border-0 py-[18px] leading-tight! [--spinner-duration:400ms]"
          >
            Add note
          </Button>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function DiscountDialog({
  discountCodes = [],
  layout = "drawer",
}: {
  discountCodes: CartApiQueryFragment["discountCodes"];
  layout?: "page" | "drawer";
}) {
  const [code, setCode] = useState("");
  const fetcher = useFetcher();
  const submitted = Boolean(code && fetcher.state === "idle" && fetcher.data);
  const success = Boolean(
    submitted && discountCodes?.find((d) => d.code === code && d.applicable),
  );
  const error = submitted && !success;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const discountCode = formData.get("discountCode") as string;
    if (discountCode) {
      // Merge new code with existing codes
      const existingCodes = discountCodes.map((d) => d.code);
      const updatedCodes = [...existingCodes, discountCode];

      fetcher.submit(
        {
          [CartForm.INPUT_NAME]: JSON.stringify({
            action: CartForm.ACTIONS.DiscountCodesUpdate,
            inputs: {
              discountCodes: updatedCodes,
            },
          }),
        },
        { method: "POST", action: "/cart" },
      );
    }
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <Dialog.Content
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          setCode("");
          fetcher.data = null;
        }}
        className={cn(
          "fixed z-50 w-full overflow-hidden",
          "bg-white p-6 shadow-xl",
          "data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down",
          layout === "drawer"
            ? "max-w-[461px] bottom-0 right-0 [--slide-up-from:100%] [--slide-down-duration:300ms] [--slide-down-to:100%]"
            : "max-w-[400px] md:max-w-[461px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [--slide-up-from:40px] [--slide-down-to:40px]",
        )}
        aria-describedby={undefined}
      >
        <Dialog.Close asChild>
          <button
            type="button"
            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </Dialog.Close>

        <Dialog.Title className="mb-4 font-medium text-sm">
          Discount Code
        </Dialog.Title>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              fetcher.data = null;
            }}
            className="w-full p-3 border border-line-subtle rounded-lg"
            type="text"
            name="discountCode"
            placeholder="Discount code"
            required
          />
          {success && (
            <Banner variant="success">Discount applied successfully 🎉</Banner>
          )}
          {error && <Banner variant="error">Invalid discount code.</Banner>}
          <Button
            type="submit"
            className="w-full border-0 py-[18px] leading-tight! [--spinner-duration:400ms]"
            loading={fetcher.state !== "idle"}
            disabled={fetcher.state !== "idle"}
          >
            Apply
          </Button>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function GiftCardDialog({
  appliedGiftCards = [],
  layout = "drawer",
}: {
  appliedGiftCards: CartApiQueryFragment["appliedGiftCards"];
  layout?: "page" | "drawer";
}) {
  const appliedGiftCardCodes = useRef<string[]>([]);
  const [code, setCode] = useState("");
  const fetcher = useFetcher();
  const submitted = Boolean(code && fetcher.state === "idle" && fetcher.data);
  const success = Boolean(
    submitted &&
    appliedGiftCards?.find((gc) =>
      code.toLowerCase().endsWith(gc.lastCharacters),
    ),
  );
  const error = submitted && !success;

  function saveAppliedCode(gcCode: string) {
    const formattedCode = gcCode.replace(/\s/g, ""); // Remove spaces
    if (!appliedGiftCardCodes.current.includes(formattedCode)) {
      appliedGiftCardCodes.current.push(formattedCode);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const giftCardCode = formData.get("giftCardCode") as string;
    if (giftCardCode) {
      fetcher.submit(
        {
          [CartForm.INPUT_NAME]: JSON.stringify({
            action: CartForm.ACTIONS.GiftCardCodesUpdate,
            inputs: {
              giftCardCode,
              giftCardCodes: appliedGiftCardCodes.current,
            },
          }),
        },
        { method: "POST", action: "/cart" },
      );
      saveAppliedCode(giftCardCode);
    }
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <Dialog.Content
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          setCode("");
          fetcher.data = null;
        }}
        className={cn(
          "fixed z-50 w-full overflow-hidden",
          "bg-white p-6 shadow-xl",
          "data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down",
          layout === "drawer"
            ? "max-w-[461px] bottom-0 right-0 [--slide-up-from:100%] [--slide-down-duration:300ms] [--slide-down-to:100%]"
            : "max-w-[400px] md:max-w-[461px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [--slide-up-from:40px] [--slide-down-to:40px]",
        )}
        aria-describedby={undefined}
      >
        <Dialog.Close asChild>
          <button
            type="button"
            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </Dialog.Close>

        <Dialog.Title className="mb-4 font-medium text-sm">
          Giftcard
        </Dialog.Title>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 border border-line-subtle rounded-lg"
            type="text"
            name="giftCardCode"
            placeholder="Giftcard"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              fetcher.data = null;
            }}
            required
          />
          {success && (
            <Banner variant="success">Gift card applied successfully 🎉</Banner>
          )}
          {error && <Banner variant="error">Invalid gift card code.</Banner>}
          <Button
            type="submit"
            className="w-full py-[18px] leading-tight! [--spinner-duration:400ms]"
            loading={fetcher.state !== "idle"}
            disabled={fetcher.state !== "idle"}
          >
            Apply
          </Button>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
