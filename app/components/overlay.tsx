import type { InspectorGroup } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { cn } from "~/utils/cn";

export interface OverlayData {
  enableOverlay: boolean;
  overlayType?: "solid" | "gradient";
  // Solid overlay options
  overlayColor: string;
  overlayColorHover: string;
  overlayOpacity: number;
  // Gradient overlay options
  gradientDirection?: "to top" | "to bottom" | "to left" | "to right";
  gradientFrom?: string;
  gradientTo?: string;
  gradientToOpacity?: number;
}

export type OverlayProps = OverlayData & {
  className?: string;
};

export function Overlay(props: OverlayProps) {
  const {
    enableOverlay,
    overlayType,
    overlayColor,
    overlayColorHover,
    overlayOpacity,
    gradientDirection,
    gradientFrom,
    gradientTo,
    gradientToOpacity,
    className,
  } = props;

  if (!enableOverlay) {
    return null;
  }

  // Convert hex color to rgba format for gradient overlays
  function hexToRgba(hex: string, opacity: number) {
    const sanitized = hex.replace("#", "");
    const bigint = Number.parseInt(
      sanitized.length === 3
        ? sanitized
            .split("")
            .map((c) => c + c)
            .join("")
        : sanitized,
      16,
    );
    const r = Math.floor(bigint / 65_536) % 256;
    const g = Math.floor(bigint / 256) % 256;
    const b = bigint % 256;
    const a = Math.max(0, Math.min(1, opacity / 100));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Gradient overlay
  if (overlayType === "gradient") {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 z-0", className)}
        style={
          {
            background: `linear-gradient(${gradientDirection}, ${hexToRgba(
              gradientFrom,
              100,
            )} 0%, ${hexToRgba(gradientTo, gradientToOpacity)} 100%)`,
          } as CSSProperties
        }
      />
    );
  }

  // Solid overlay
  return (
    <div
      className={cn(
        "absolute inset-0 z-[-1] transition-colors duration-300",
        "bg-(--overlay-color)",
        "group-hover/overlay:bg-(--overlay-color-hover,var(--overlay-color))",
        className,
      )}
      style={
        {
          "--overlay-color": overlayColor,
          "--overlay-color-hover": overlayColorHover,
          opacity: overlayOpacity / 100,
          margin: 0,
        } as CSSProperties
      }
    />
  );
}

export const overlayInputs: InspectorGroup["inputs"] = [
  {
    type: "switch",
    name: "enableOverlay",
    label: "Enable overlay",
    defaultValue: false,
  },
  {
    type: "select",
    name: "overlayType",
    label: "Overlay type",
    defaultValue: "solid",
    condition: (data: OverlayData) => data.enableOverlay,
    configs: {
      options: [
        { value: "solid", label: "Solid" },
        { value: "gradient", label: "Gradient" },
      ],
    },
  },
  {
    type: "color",
    name: "overlayColor",
    label: "Overlay color",
    defaultValue: "#000000",
    condition: (data: OverlayData) =>
      data.enableOverlay && data.overlayType === "solid",
  },
  {
    type: "color",
    name: "overlayColorHover",
    label: "Overlay color (hover)",
    condition: (data: OverlayData) =>
      data.enableOverlay && data.overlayType === "solid",
  },
  {
    type: "range",
    name: "overlayOpacity",
    label: "Overlay opacity",
    defaultValue: 50,
    configs: {
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
    },
    condition: (data: OverlayData) =>
      data.enableOverlay && data.overlayType === "solid",
  },
  {
    type: "select",
    name: "gradientDirection",
    label: "Gradient direction",
    condition: (data: OverlayData) =>
      data.enableOverlay && data.overlayType === "gradient",
    configs: {
      options: [
        { value: "to top", label: "To top" },
        { value: "to bottom", label: "To bottom" },
        { value: "to left", label: "To left" },
        { value: "to right", label: "To right" },
      ],
    },
    defaultValue: "to top",
  },
  {
    type: "color",
    name: "gradientFrom",
    label: "Gradient from color",
    defaultValue: "#000000",
    condition: (data: OverlayData) =>
      data.enableOverlay && data.overlayType === "gradient",
  },
  {
    type: "color",
    name: "gradientTo",
    label: "Gradient to color",
    defaultValue: "#000000",
    condition: (data: OverlayData) =>
      data.enableOverlay && data.overlayType === "gradient",
  },
  {
    type: "range",
    name: "gradientToOpacity",
    label: "Gradient to opacity",
    defaultValue: 0,
    configs: {
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
    },
    condition: (data: OverlayData) =>
      data.enableOverlay && data.overlayType === "gradient",
  },
];
