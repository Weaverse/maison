/**
 * Guards form endpoints against cross-site POSTs. The storefront's own forms
 * always send an `Origin` header, so a request without one — or with one from
 * another site — did not come from us.
 */
export function isSameOriginPost(request: Request) {
  if (request.method.toUpperCase() !== "POST") {
    return false;
  }

  const origin = request.headers.get("Origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
