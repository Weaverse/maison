import { useItemInstance } from "@weaverse/hydrogen";
import { type RefObject, useEffect, useState } from "react";

export function useClosestWeaverseItem<T>(ref: RefObject<T>) {
  const [weaverseId, setWeaverseId] = useState<string>("");
  const weaverseItem = useItemInstance(weaverseId);

  useEffect(() => {
    if (!weaverseItem && ref.current) {
      const closest = (ref.current as HTMLElement).closest("[data-wv-id]");
      if (closest) {
        setWeaverseId(closest.getAttribute("data-wv-id"));
      }
    }
    // oxlint-disable-next-line react/exhaustive-deps -- assuming `selector` does not change
  }, [ref]);

  return weaverseItem;
}
