import type { ZoneWeather } from "@/types/weather";

/**
 * Picks the zone the "Current conditions" card describes: the one with the
 * heaviest hourly rain forecast in the next 24 hours.
 *
 * @param zones - Zones with an id and a name.
 * @param weather - Weather by zone id, `null` (or missing) where unavailable.
 * @returns The zone with the highest `maxRainNext24h`, the alphabetically first
 * on a tie; `null` when no zone has weather.
 */
export function pickConditionsZone<T extends { id: string; name: string }>(
  zones: T[],
  weather: Record<string, ZoneWeather | null>,
): T | null {
  let best: { zone: T; rain: number } | null = null;
  for (const zone of zones) {
    const current = weather[zone.id];
    if (!current) continue;
    const rain = current.maxRainNext24h;
    if (!best || rain > best.rain || (rain === best.rain && zone.name.localeCompare(best.zone.name) < 0)) {
      best = { zone, rain };
    }
  }
  return best?.zone ?? null;
}
