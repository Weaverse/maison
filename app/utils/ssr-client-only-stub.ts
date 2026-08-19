/**
 * SSR replacement for heavy browser-only modules configured in vite.config.ts.
 * The real component is lazy-loaded and only rendered after the hero video is
 * visible in the browser, so the server never needs to evaluate it.
 */
export default function ClientOnlyStub(): null {
  return null;
}
