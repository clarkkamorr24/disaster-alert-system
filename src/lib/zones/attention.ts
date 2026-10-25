import { SEVERITIES } from "@/lib/domain/hazards";
import type { ZoneMapPoint } from "@/types/zone";

/** How many zones the dashboard lists before pointing to `/zones`. */
export const ATTENTION_LIMIT = 5;

function severityRank(zone: ZoneMapPoint): number {
  return zone.worstSeverity ? SEVERITIES[zone.worstSeverity].rank : 0;
}

/**
 * Picks the zones an officer should look at now: an active High or Critical
 * alert, rainfall at Yellow or higher in the next 24 hours, or weather
 * unavailable for that zone. Moderate and Low zones show only on the map and
 * in the status counts, unless rain or missing weather also applies.
 * When no zone has weather (an Open-Meteo outage), missing weather is not
 * counted, so an outage doesn't list every zone.
 *
 * @param zones - Every zone, ordered by name.
 * @returns The zones needing attention, worst active severity first, then the
 *   heaviest rain in the next 24 hours, then the most active members, then by name.
 */
export function selectAttentionZones(zones: ZoneMapPoint[]): ZoneMapPoint[] {
  const weatherDown = zones.every((zone) => zone.rainfallLevel === null);
  return zones
    .filter(
      (zone) =>
        severityRank(zone) >= SEVERITIES.HIGH.rank ||
        (zone.rainfallLevel !== null && zone.rainfallLevel !== "NONE") ||
        (zone.rainfallLevel === null && !weatherDown),
    )
    .sort(
      (a, b) =>
        severityRank(b) - severityRank(a) ||
        (b.maxRainNext24h ?? -1) - (a.maxRainNext24h ?? -1) ||
        b.memberCount - a.memberCount,
    );
}
