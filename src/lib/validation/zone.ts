import { z } from "zod";

import { boundaryToLatLngs, isInMiIsi, isInRings, OUTSIDE_MI_ISI_MESSAGE } from "@/lib/map";
import { ZONE_COLOR_KEYS } from "@/lib/zone-colors";

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

/** Shown when a drawn corner falls outside Barangay Mi-isi. */
export const BOUNDARY_OUTSIDE_MI_ISI_MESSAGE = "Part of the boundary is outside Barangay Mi-isi.";

/** Shown when the zone's center (where its label sits) is outside its drawn boundary. */
export const CENTER_OUTSIDE_BOUNDARY_MESSAGE = "Move the center pin inside the purok's boundary.";

const INVALID_BOUNDARY_MESSAGE = "Draw the boundary again.";

/** Turns a blank form string into `undefined` and parses JSON, leaving other input to the schema. */
function fromFormJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (value.trim() === "") return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const position = z.tuple([z.number(), z.number()]);

/**
 * A GeoJSON Polygon with one closed ring of 4–200 positions (3–199 corners).
 * shortcut: self-intersection is only blocked by Geoman while drawing; add a segment check if boundaries are ever imported.
 */
const boundarySchema = z
  .object(
    {
      type: z.literal("Polygon", { error: INVALID_BOUNDARY_MESSAGE }),
      // abort: Zod 4 checks continue by default, which would run the Mi-isi checks on a broken ring.
      coordinates: z.tuple(
        [
          z
            .array(position)
            .min(4, { error: INVALID_BOUNDARY_MESSAGE, abort: true })
            .max(200, { error: INVALID_BOUNDARY_MESSAGE, abort: true }),
        ],
        { error: INVALID_BOUNDARY_MESSAGE },
      ),
    },
    { error: INVALID_BOUNDARY_MESSAGE },
  )
  .refine(({ coordinates: [ring] }) => ring[0].every((value, i) => value === ring.at(-1)?.[i]), {
    error: INVALID_BOUNDARY_MESSAGE,
    abort: true,
  });

/**
 * The zone form: a trimmed name (2–60 characters), an optional description
 * (up to 200 characters; blank becomes `undefined`), a center point inside
 * Barangay Mi-isi, and optionally a drawn boundary (form JSON) and a color.
 * An out-of-bounds point is reported on `latitude`, with the
 * swapped-coordinates hint when it isn't even in the Philippines. Every corner
 * of the boundary must be inside Mi-isi and the center inside the boundary,
 * which keeps the zone's label inside its area; both are reported on `boundary`.
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
    boundary: z.preprocess(fromFormJson, boundarySchema.optional()),
    color: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(ZONE_COLOR_KEYS, { error: "Choose a color." }).optional(),
    ),
  })
  .superRefine((zone, ctx) => {
    if (!isInPhilippines(zone.latitude, zone.longitude)) {
      ctx.addIssue({ code: "custom", message: OUTSIDE_PHILIPPINES_MESSAGE, path: ["latitude"] });
    } else if (!isInMiIsi(zone.latitude, zone.longitude)) {
      ctx.addIssue({ code: "custom", message: OUTSIDE_MI_ISI_MESSAGE, path: ["latitude"] });
    }

    if (!zone.boundary) return;
    const corners = boundaryToLatLngs(zone.boundary);
    if (!corners.every(([lat, lng]) => isInMiIsi(lat, lng))) {
      ctx.addIssue({ code: "custom", message: BOUNDARY_OUTSIDE_MI_ISI_MESSAGE, path: ["boundary"] });
    } else if (!isInRings([corners], zone.latitude, zone.longitude)) {
      ctx.addIssue({ code: "custom", message: CENTER_OUTSIDE_BOUNDARY_MESSAGE, path: ["boundary"] });
    }
  });

/** A parsed, valid zone form. */
export type ZoneInput = z.infer<typeof zoneInputSchema>;
