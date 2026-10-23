import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

import type { RainfallLevel, ZoneWeather } from "@/types/weather";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 10_000;

/** The URL asks for `timezone=Asia/Manila`, so every time Open-Meteo returns is in this offset. */
const MANILA_OFFSET = "+08:00";

const forecastSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    precipitation: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
  }),
  hourly: z.object({
    // Open-Meteo uses null for an hour it has no value for.
    precipitation: z.array(z.number().nullable()),
  }),
});

/**
 * Labels an hourly rain rate with PAGASA's rainfall warning levels.
 *
 * @param mmPerHour - Rain in mm per hour.
 * @returns `NONE` below 7.5, `YELLOW` from 7.5 to under 15, `ORANGE` from 15 to 30, `RED` above 30.
 *
 * @example
 * classifyRainfall(15); // "ORANGE"
 */
export function classifyRainfall(mmPerHour: number): RainfallLevel {
  if (mmPerHour > 30) return "RED";
  if (mmPerHour >= 15) return "ORANGE";
  if (mmPerHour >= 7.5) return "YELLOW";
  return "NONE";
}

/**
 * Builds one Open-Meteo forecast URL for several points, with current weather and
 * 24 hours of hourly rain in Manila time.
 *
 * @param points - Coordinates in the order the results should come back.
 * @returns The forecast URL, with the coordinates comma-separated.
 */
export function buildForecastUrl(points: { latitude: number; longitude: number }[]): string {
  const latitudes = points.map((p) => p.latitude).join(",");
  const longitudes = points.map((p) => p.longitude).join(",");
  return (
    `${FORECAST_ENDPOINT}?latitude=${latitudes}&longitude=${longitudes}` +
    "&current=temperature_2m,precipitation,weather_code,wind_speed_10m" +
    "&hourly=precipitation&forecast_hours=24&timezone=Asia%2FManila"
  );
}

/** Reads one location's forecast, or `null` when it is missing a value we need. */
function parseLocation(entry: unknown): ZoneWeather | null {
  const parsed = forecastSchema.safeParse(entry);
  if (!parsed.success) return null;

  const { current, hourly } = parsed.data;
  const hourlyRain = hourly.precipitation.filter((mm): mm is number => mm !== null);
  if (hourlyRain.length === 0) return null;

  const maxRainNext24h = Math.max(...hourlyRain);
  return {
    tempC: current.temperature_2m,
    precipMm: current.precipitation,
    windKmh: current.wind_speed_10m,
    weatherCode: current.weather_code,
    maxRainNext24h,
    rainfallLevel: classifyRainfall(maxRainNext24h),
    fetchedAt: current.time,
  };
}

/**
 * Reads an Open-Meteo forecast response. Open-Meteo returns a single object for one
 * point and an array for several.
 *
 * @param json - The parsed response body.
 * @param count - How many points were requested.
 * @returns Exactly `count` entries in request order, `null` for any entry that can't be
 *   read (all `null` for an error body such as `{ error: true, reason }`).
 */
export function parseForecast(json: unknown, count: number): (ZoneWeather | null)[] {
  const entries = Array.isArray(json) ? json : [json];
  return Array.from({ length: count }, (_, i) => parseLocation(entries[i]));
}

/**
 * Describes a WMO weather code in plain words.
 *
 * @param code - Open-Meteo's `weather_code`.
 * @returns Text such as `Rain showers`, or `—` for codes outside the groups shown.
 */
export function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code >= 1 && code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "—";
}

/**
 * Turns an Open-Meteo time from {@link buildForecastUrl} (Manila local, no offset) into a date.
 *
 * @param time - A time such as `2026-10-23T18:30`.
 * @returns The UTC instant.
 */
export function forecastTimeToDate(time: string): Date {
  return new Date(`${time}${MANILA_OFFSET}`);
}

/**
 * Fetches a forecast URL, cached for 30 minutes per URL. It throws on a non-2xx
 * response, a timeout, or a body that isn't JSON, so failures are never cached.
 *
 * @param url - A URL from {@link buildForecastUrl}.
 * @returns The parsed JSON body.
 */
export async function fetchForecast(url: string): Promise<unknown> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 3600 });

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}.`);
  return res.json();
}

/**
 * Gets the weather for every zone in one Open-Meteo request. Never throws: when the
 * request fails, every zone gets `null`.
 *
 * @param zones - Zones with their center coordinates.
 * @returns Weather by zone id, `null` where unavailable; `{}` without a request when there are no zones.
 */
export async function getZoneWeather(
  zones: { id: string; latitude: number; longitude: number }[],
): Promise<Record<string, ZoneWeather | null>> {
  if (zones.length === 0) return {};

  let results: (ZoneWeather | null)[];
  try {
    results = parseForecast(await fetchForecast(buildForecastUrl(zones)), zones.length);
  } catch {
    // Next already logs the error thrown inside the cached fetch, with its real message.
    results = zones.map(() => null);
  }
  return Object.fromEntries(zones.map((zone, i) => [zone.id, results[i]]));
}
