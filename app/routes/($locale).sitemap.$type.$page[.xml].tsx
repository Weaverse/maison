import { getSitemap } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";
import { DEFAULT_LOCALE } from "~/utils/const";
import { intlLocale } from "~/utils/locale";

export async function loader({
  request,
  params,
  context: { storefront },
}: LoaderFunctionArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    // Only the default market is listed. Handing `getSitemap` every locale
    // makes it build `hreflang` alternates by pasting a prefix onto one
    // handle, but a handle belongs to a market: Shopify localizes it, and a
    // resource can be unpublished in one market and not another. Those
    // alternates would then redirect or 404. Missing an alternate only costs
    // discovery in that market; a wrong one tells search engines a page is
    // there when it is not.
    locales: [intlLocale(DEFAULT_LOCALE)],
    getLink: ({ type, baseUrl, handle }) => `${baseUrl}/${type}/${handle}`,
  });

  response.headers.set("Cache-Control", `max-age=${60 * 60 * 24}`);

  return response;
}
