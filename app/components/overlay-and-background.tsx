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
    enableImageHover,
    enableOverlay,
    overlayType,
    overlayColor,
    overlayColorHover,
    overlayOpacity,
    gradientDirection,
    gradientFrom,
    gradientFromOpacity,
    gradientTo,
    gradientToOpacity,
  } = props;
  return (
    <>
      <BackgroundImage
        backgroundImage={backgroundImage}
        backgroundFit={backgroundFit}
        backgroundPosition={backgroundPosition}
        enableImageHover={enableImageHover}
      />
      <Overlay
        enableOverlay={enableOverlay}
        overlayType={overlayType}
        overlayColor={overlayColor}
        overlayColorHover={overlayColorHover}
        overlayOpacity={overlayOpacity}
        gradientDirection={gradientDirection}
        gradientFrom={gradientFrom}
        gradientFromOpacity={gradientFromOpacity}
        gradientTo={gradientTo}
        gradientToOpacity={gradientToOpacity}
      />
    </>
  );
}
