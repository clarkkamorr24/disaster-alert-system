import { z } from "zod";

/** Latitude and longitude bounds that contain the whole Philippines. */
export const PHILIPPINE_BOUNDS = { minLat: 4, maxLat: 22, minLng: 116, maxLng: 127 } as const;

/** Shown when a zone's center falls outside {@link PHILIPPINE_BOUNDS}. */
export const OUTSIDE_PHILIPPINES_MESSAGE =
  "Coordinates are outside the Philippines. Check that latitude and longitude are not swapped.";

/**
 * Checks whether a point lies inside {@link PHILIPPINE_BOUNDS}.
 *
 * Latitude and longitude ranges don't overlap here, so swapped coordinates
 * always fail this check.
 *
 * @param latitude - Degrees north.
 * @param longitude - Degrees east.
 * @returns `true` when both values are within the bounds, inclusive.
 */
export function isInPhilippines(latitude: number, longitude: number): boolean {
  const { minLat, maxLat, minLng, maxLng } = PHILIPPINE_BOUNDS;
  return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
}

/** A required coordinate that accepts a number or a form string; blank strings count as missing. */
function coordinate(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : Number(trimmed);
    },
    z.number({
      error: (issue) =>
        issue.input === undefined ? `Enter the ${label}.` : `Enter the ${label} as a number.`,
    }),
  );
}

/**
 * The zone form: a trimmed name (2–60 characters), an optional description
 * (up to 200 characters; blank becomes `undefined`), and a center point inside
 * the Philippines. An out-of-bounds point is reported on `latitude`.
 */
export const zoneInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters.")
      .max(60, "Use 60 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(200, "Use 200 characters or fewer.")
      .optional()
      .transform((value) => value || undefined),
    latitude: coordinate("latitude"),
    longitude: coordinate("longitude"),
  })
  .refine((zone) => isInPhilippines(zone.latitude, zone.longitude), {
    message: OUTSIDE_PHILIPPINES_MESSAGE,
    path: ["latitude"],
  });

/** A parsed, valid zone form. */
export type ZoneInput = z.infer<typeof zoneInputSchema>;
