import type { Icon } from "@phosphor-icons/react";
import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  PinterestLogoIcon,
  ThreadsLogoIcon,
  TiktokLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import { SOCIAL_SLOT_COUNT } from "~/utils/const";

/**
 * What an icon slot can be set to.
 *
 * The announcement bar and the footer each own their slots and their links —
 * one is a short row of whatever the shop wants to point at, the other lists
 * the shop's accounts — but both draw from this same set of marks, so the
 * lookup lives in one place rather than being copied into each.
 */
export const SOCIAL_ICONS: Record<string, { name: string; Icon: Icon }> = {
  instagram: { name: "Instagram", Icon: InstagramLogoIcon },
  facebook: { name: "Facebook", Icon: FacebookLogoIcon },
  x: { name: "X", Icon: XLogoIcon },
  linkedin: { name: "LinkedIn", Icon: LinkedinLogoIcon },
  tiktok: { name: "TikTok", Icon: TiktokLogoIcon },
  youtube: { name: "YouTube", Icon: YoutubeLogoIcon },
  pinterest: { name: "Pinterest", Icon: PinterestLogoIcon },
  threads: { name: "Threads", Icon: ThreadsLogoIcon },
};

/**
 * The slots of one row that are worth drawing, in order.
 *
 * Stops at the row's own "Icons to show" count, so turning the slider down
 * takes an icon off the page without the merchant having to clear the fields
 * behind it — turning it back up brings the same icon and link back.
 *
 * Within that, a slot still needs both halves: an icon that is not "none",
 * and somewhere for it to go.
 */
export function resolveSocialSlots(
  settings: Record<string, unknown>,
  prefix: string,
) {
  const accounts: { key: number; name: string; Icon: Icon; to: string }[] = [];
  const shown = Math.min(
    Number(settings[`${prefix}sToShow`] ?? 0),
    SOCIAL_SLOT_COUNT,
  );

  for (let index = 1; index <= shown; index += 1) {
    const chosen = SOCIAL_ICONS[settings[`${prefix}${index}Icon`] as string];
    const link = settings[`${prefix}${index}Link`];
    const to = typeof link === "string" ? link.trim() : "";
    if (chosen && to) {
      accounts.push({ key: index, ...chosen, to });
    }
  }

  return accounts;
}
