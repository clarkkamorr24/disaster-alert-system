import { MI_ISI_BOUNDARY } from "@/lib/mi-isi-boundary";

const points = MI_ISI_BOUNDARY.flat();

/** The box around Barangay Mi-isi as `[[south, west], [north, east]]`; every map opens on it. */
export const MI_ISI_BOUNDS: [[number, number], [number, number]] = [
  [Math.min(...points.map(([lat]) => lat)), Math.min(...points.map(([, lng]) => lng))],
  [Math.max(...points.map(([lat]) => lat)), Math.max(...points.map(([, lng]) => lng))],
];

/** Shown when a zone's center is outside Barangay Mi-isi. */
export const OUTSIDE_MI_ISI_MESSAGE = "This point is outside Barangay Mi-isi. Choose a point inside the boundary.";

/**
 * Checks whether a point lies inside Barangay Mi-isi ({@link MI_ISI_BOUNDARY}).
 *
 * Uses ray casting over every part of the boundary; the parts don't overlap, so
 * an odd number of crossings means inside one of them.
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
  let inside = false;
  for (const ring of MI_ISI_BOUNDARY) {
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

/** OpenStreetMap's standard tile layer. */
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Attribution the OSM tile usage policy requires on the map. */
export const OSM_ATTRIBUTION = "&copy; OpenStreetMap contributors";
