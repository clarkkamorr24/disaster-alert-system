/**
 * The colors an officer can give a purok's drawn area, keyed as stored in
 * `FarmZone.color`. None is red, orange, yellow, green, or gray, so the areas
 * never read as an alert severity. The values live in `globals.css`
 * (`--zone-area-<key>`).
 */
export const ZONE_COLORS = {
  sky: "Sky blue",
  blue: "Blue",
  indigo: "Indigo",
  violet: "Violet",
  purple: "Purple",
  fuchsia: "Fuchsia",
  pink: "Pink",
  cyan: "Cyan",
} as const;

/** A key of {@link ZONE_COLORS}. */
export type ZoneColor = keyof typeof ZONE_COLORS;

/** Every {@link ZoneColor}, in swatch order. */
export const ZONE_COLOR_KEYS = Object.keys(ZONE_COLORS) as [ZoneColor, ...ZoneColor[]];

/**
 * Picks the color for a new or uncolored zone: the first one no other zone uses,
 * or the first color once all are taken.
 *
 * @param usedColors - The colors other zones already have (`null` entries are ignored).
 * @returns A {@link ZoneColor}.
 *
 * @example
 * firstUnusedZoneColor(["sky", null]); // "blue"
 */
export function firstUnusedZoneColor(usedColors: (string | null)[]): ZoneColor {
  return ZONE_COLOR_KEYS.find((key) => !usedColors.includes(key)) ?? ZONE_COLOR_KEYS[0];
}

/**
 * Reads a stored color, falling back to the first one for zones saved before
 * colors existed or with a key that was removed.
 *
 * @param color - The stored `FarmZone.color`.
 * @returns A {@link ZoneColor}.
 */
export function toZoneColor(color: string | null): ZoneColor {
  return color && Object.hasOwn(ZONE_COLORS, color) ? (color as ZoneColor) : ZONE_COLOR_KEYS[0];
}
