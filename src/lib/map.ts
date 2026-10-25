import { MI_ISI_BOUNDARY } from "@/lib/mi-isi-boundary";
import type { ZoneBoundary } from "@/types/zone";

const points = MI_ISI_BOUNDARY.flat();

/** The box around Barangay Mi-isi as `[[south, west], [north, east]]`; every map opens on it. */
export const MI_ISI_BOUNDS: [[number, number], [number, number]] = [
  [Math.min(...points.map(([lat]) => lat)), Math.min(...points.map(([, lng]) => lng))],
  [Math.max(...points.map(([lat]) => lat)), Math.max(...points.map(([, lng]) => lng))],
];

/** Shown when a zone's center is outside Barangay Mi-isi. */
export const OUTSIDE_MI_ISI_MESSAGE = "This point is outside Barangay Mi-isi. Choose a point inside the boundary.";

/**
 * Checks whether a point lies inside any of the given `[lat, lng]` rings.
 *
 * Uses ray casting over every ring; the rings must not overlap, so an odd
 * number of crossings means inside one of them.
 *
 * @param rings - Polygon rings as `[lat, lng]` points; closing the ring is optional.
 * @param latitude - Degrees north.
 * @param longitude - Degrees east.
 * @returns `true` when the point is inside.
 */
export function isInRings(rings: [number, number][][], latitude: number, longitude: number): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [latI, lngI] = ring[i];
      const [latJ, lngJ] = ring[j];
      if (latI > latitude !== latJ > latitude && longitude < ((lngJ - lngI) * (latitude - latI)) / (latJ - latI) + lngI) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/**
 * Checks whether a point lies inside Barangay Mi-isi ({@link MI_ISI_BOUNDARY}).
 *
 * @param latitude - Degrees north.
 * @param longitude - Degrees east.
 * @returns `true` when the point is inside the boundary.
 *
 * @example
 * isInMiIsi(13.1953, 123.6886); // true
 * isInMiIsi(13.17, 123.66); // false
 */
export function isInMiIsi(latitude: number, longitude: number): boolean {
  return isInRings(MI_ISI_BOUNDARY, latitude, longitude);
}

/**
 * Turns a stored purok boundary (GeoJSON, `[lng, lat]`, closed ring) into the
 * `[lat, lng]` corners Leaflet draws, without the repeated closing point.
 *
 * @param boundary - A saved {@link ZoneBoundary}.
 * @returns The corners in drawing order.
 */
export function boundaryToLatLngs(boundary: ZoneBoundary): [number, number][] {
  return boundary.coordinates[0].slice(0, -1).map(([lng, lat]) => [lat, lng]);
}

/**
 * Turns drawn `[lat, lng]` corners into a GeoJSON Polygon (`[lng, lat]`), closing the ring.
 *
 * @param corners - The polygon's corners, without a closing point.
 * @returns The {@link ZoneBoundary} to save.
 *
 * @example
 * latLngsToBoundary([[13.2, 123.69], [13.2, 123.7], [13.21, 123.7]]);
 * // { type: "Polygon", coordinates: [[[123.69, 13.2], [123.7, 13.2], [123.7, 13.21], [123.69, 13.2]]] }
 */
export function latLngsToBoundary(corners: [number, number][]): ZoneBoundary {
  const ring = corners.map(([lat, lng]): [number, number] => [lng, lat]);
  return { type: "Polygon", coordinates: [[...ring, ring[0]]] };
}

/** OpenStreetMap's standard tile layer. */
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Attribution the OSM tile usage policy requires on the map. */
export const OSM_ATTRIBUTION = "&copy; OpenStreetMap contributors";
