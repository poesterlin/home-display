import type { Color } from "@esphome-designer/schema";

/**
 * Converts a schema Color object to a CSS rgb() string
 */
export function colorToCss(color: Color | undefined, fallback = "white"): string {
  if (!color) return fallback;
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
