import type { LoaderFunctionArgs } from "@shopify/remix-oxygen";
import { getWeaverseSeoMeta } from "@weaverse/hydrogen";
import type { MetaFunction } from "react-router";
import { validateWeaverseData, WeaverseContent } from "~/weaverse";

export async function loader({ context }: LoaderFunctionArgs) {
  const weaverseData = await context.weaverse.loadPage({
    type: "CUSTOM",
  });

  validateWeaverseData(weaverseData);

  return {
    weaverseData,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return getWeaverseSeoMeta(data?.weaverseData);
};

export default function Component() {
  return <WeaverseContent />;
}
