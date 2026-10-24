/**
 * Formats a zone's center for display, with hemisphere letters instead of signs.
 *
 * @param latitude - Decimal degrees, negative south of the equator.
 * @param longitude - Decimal degrees, negative west of Greenwich.
 * @returns Text such as `13.143° N, 123.712° E`, three decimals each.
 *
 * @example
 * formatCoordinates(13.1432, 123.7121); // "13.143° N, 123.712° E"
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(3)}° ${latitude < 0 ? "S" : "N"}`;
  const lng = `${Math.abs(longitude).toFixed(3)}° ${longitude < 0 ? "W" : "E"}`;
  return `${lat}, ${lng}`;
}
