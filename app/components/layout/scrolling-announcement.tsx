import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect } from "react";
import { CompanyLocationButton } from "~/components/b2b/company-location-button";
import { resolveSocialSlots } from "~/components/layout/social-icons";

const MAX_DURATION = 20;

export function ScrollingAnnouncement() {
  const themeSettings = useThemeSettings();
  const {
    topbarText,
    topbarHeight,
    topbarTextColor,
    topbarBgColor,
    topbarScrollingGap,
    topbarScrollingSpeed,
  } = themeSettings;

  function updateStyles() {
    if (topbarText) {
      document.body.style.setProperty(
        "--topbar-height",
        `${Math.max(topbarHeight - window.scrollY, 0)}px`,
      );
    } else {
      document.body.style.setProperty("--topbar-height", "0px");
    }
  }

  useEffect(() => {
    updateStyles();
    window.addEventListener("scroll", updateStyles);
    return () => window.removeEventListener("scroll", updateStyles);
    // oxlint-disable-next-line react/exhaustive-deps -- Rebind the scroll listener when the announcement text changes.
  }, [topbarText]);

  if (topbarText?.replace(/<[^>]*>/g, "").trim() === "") {
    return null;
  }

  const socials = resolveSocialSlots(themeSettings, "topbarSocial");

  return (
    <div
      id="announcement-bar"
      className="relative flex w-full items-center justify-center py-3 xl:py-2"
      style={
        {
          height: `${topbarHeight}px`,
          backgroundColor: topbarBgColor,
          color: topbarTextColor,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex h-full w-full max-w-(--page-width) items-center justify-center px-5 md:px-8 xl:gap-8 xl:px-10">
        {/* Left — socials */}
        <div className="hidden flex-1 items-center gap-3 xl:flex">
          {socials.map(({ key, name, to, Icon }) => (
            <a
              aria-label={name}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line transition-opacity hover:opacity-70"
              href={to}
              key={key}
              rel="noreferrer"
              target="_blank"
            >
              <Icon className="size-[18px]" />
            </a>
          ))}
        </div>

        {/* Middle — scrolling below lg, static from lg */}
        <div
          className="flex w-full items-center justify-center opacity-80 xl:w-[600px]"
          style={
            {
              "--marquee-duration": `${MAX_DURATION / topbarScrollingSpeed}s`,
              "--gap": `${topbarScrollingGap}px`,
            } as React.CSSProperties
          }
        >
          <div className="flex w-full items-center overflow-hidden whitespace-nowrap xl:hidden">
            {new Array(10).fill("").map((_, idx) => (
              <div
                className="animate-marquee px-[calc(var(--gap)/2)]"
                key={idx}
              >
                <div
                  className="flex items-center gap-(--gap) whitespace-nowrap text-base leading-[1.6] tracking-[0.28px] [&_p]:flex [&_p]:items-center [&_p]:gap-2"
                  dangerouslySetInnerHTML={{ __html: topbarText }}
                  suppressHydrationWarning
                />
              </div>
            ))}
          </div>

          <div
            className="hidden flex-1 text-center text-base leading-[1.6] tracking-[0.28px] xl:block [&_p]:inline"
            dangerouslySetInnerHTML={{ __html: topbarText }}
            suppressHydrationWarning
          />
        </div>

        {/* Right — company location */}
        <div className="hidden flex-1 justify-end xl:flex">
          <CompanyLocationButton />
        </div>
      </div>
    </div>
  );
}
