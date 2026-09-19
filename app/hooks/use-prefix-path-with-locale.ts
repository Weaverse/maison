import { useSelectedLocale } from "~/hooks/use-locale";
import { prefixPathWithLocale } from "~/utils/locale";

/**
 * Prefix an internal path with the active locale.
 *
 * Absolute URLs, fragments and paths that already carry a locale are returned
 * untouched, so this is safe to apply to any link target.
 */
export function usePrefixPathWithLocale(path: string) {
  return prefixPathWithLocale(path, useSelectedLocale());
}
