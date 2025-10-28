import type { BackgroundImageProps } from "./background-image";
import { BackgroundImage } from "./background-image";
import type { OverlayProps } from "./overlay";
import { Overlay } from "./overlay";

export interface OverlayAndBackgroundProps
  extends Partial<BackgroundImageProps>,
    Partial<OverlayProps> {}

export function OverlayAndBackground(props: OverlayAndBackgroundProps) {
  const {
    backgroundImage,
    backgroundFit,
    backgroundPosition,
    enableOverlay,
    overlayType,
    overlayColor,
    overlayColorHover,
    overlayOpacity,
    gradientDirection,
    gradientFrom,
    gradientTo,
    gradientToOpacity,
  } = props;
  return (
    <>
      <BackgroundImage
        backgroundImage={backgroundImage}
        backgroundFit={backgroundFit}
        backgroundPosition={backgroundPosition}
      />
      <Overlay
        enableOverlay={enableOverlay}
        overlayType={overlayType}
        overlayColor={overlayColor}
        overlayColorHover={overlayColorHover}
        overlayOpacity={overlayOpacity}
        gradientDirection={gradientDirection}
        gradientFrom={gradientFrom}
        gradientTo={gradientTo}
        gradientToOpacity={gradientToOpacity}
      />
    </>
  );
}
