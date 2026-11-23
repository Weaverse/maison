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
const SOCIAL_ICONS: Record<string, { name: string; Icon: Icon }> = {
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
 * Where a link lived before the rows had slots of their own.
 *
 * Both rows used to read these four settings directly. A theme that upgrades
 * into the slot fields finds them empty, so a shop that had filled these in
 * would lose its icons on the deploy; the row falls back to them instead.
 */
const LEGACY_LINK_SETTINGS: Record<string, string> = {
  instagram: "socialInstagram",
  x: "socialX",
  linkedin: "socialLinkedIn",
  facebook: "socialFacebook",
};

export type SocialAccount = {
  key: number;
  name: string;
  Icon: Icon;
  to: string;
};

/**
 * The slots of one row that are worth drawing, in order.
 *
 * Stops at the row's own "Icons to show" count, so turning the slider down
 * takes an icon off the page without the merchant having to clear the fields
 * behind it — turning it back up brings the same icon and link back.
 *
 * Within that, a slot still needs both halves: an icon that is not "none",
 * and somewhere for it to go. A row with no link typed into any of its slots
 * is read as one that has not been filled in yet rather than one deliberately
 * emptied, and the pre-slot settings answer for it — see
 * `legacySocialAccounts`.
 */
export function resolveSocialSlots(
  settings: Record<string, unknown>,
  prefix: string,
): SocialAccount[] {
  const accounts: SocialAccount[] = [];
  const shown = Math.min(
    Number(settings[`${prefix}sToShow`] ?? 0),
    SOCIAL_SLOT_COUNT,
  );

  for (let index = 1; index <= shown; index += 1) {
    const chosen = SOCIAL_ICONS[settings[`${prefix}${index}Icon`] as string];
    const to = trimmed(settings[`${prefix}${index}Link`]);
    if (chosen && to) {
      accounts.push({ key: index, ...chosen, to });
    }
  }

  if (hasOwnLink(settings, prefix)) {
    return accounts;
  }

  return legacySocialAccounts(settings, prefix, shown);
}

/**
 * Whether this row has been written to at all.
 *
 * Asked of the links rather than of the accounts built from them: a slot
 * whose link is filled in but whose icon is still "none" produces nothing,
 * and reading that as an untouched row brought the old links back under a
 * merchant who had plainly started moving across.
 *
 * Every slot counts, not only the ones the count currently reveals, so
 * turning the count down cannot resurrect the fallback either.
 */
function hasOwnLink(settings: Record<string, unknown>, prefix: string) {
  for (let index = 1; index <= SOCIAL_SLOT_COUNT; index += 1) {
    if (trimmed(settings[`${prefix}${index}Link`])) {
      return true;
    }
  }
  return false;
}

/**
 * The same row, with each slot's link taken from the setting that used to
 * hold it.
 *
 * The slots still decide which marks appear and in what order — only the
 * links come from the old keys, and only the four platforms that had one.
 * Filling in any slot link ends the fallback for the whole row, which is what
 * a merchant moving to the new fields would expect.
 */
function legacySocialAccounts(
  settings: Record<string, unknown>,
  prefix: string,
  shown: number,
): SocialAccount[] {
  const accounts: SocialAccount[] = [];

  for (let index = 1; index <= shown; index += 1) {
    const iconKey = settings[`${prefix}${index}Icon`] as string;
    const chosen = SOCIAL_ICONS[iconKey];
    const legacyName = LEGACY_LINK_SETTINGS[iconKey];
    const to = legacyName ? trimmed(settings[legacyName]) : "";
    if (chosen && to) {
      accounts.push({ key: index, ...chosen, to });
    }
  }

  return accounts;
}

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
