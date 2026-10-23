/** The Lucide icon that stands for a group of WMO weather codes. */
export type WeatherIconName =
  | "Sun"
  | "CloudSun"
  | "Cloud"
  | "CloudFog"
  | "CloudDrizzle"
  | "CloudRain"
  | "Snowflake"
  | "CloudLightning";

/**
 * Picks the icon for a WMO weather code.
 *
 * @param code - Open-Meteo's `weather_code`.
 * @returns The Lucide icon name; `Cloud` for codes outside the known groups.
 *
 * @example
 * weatherIconName(63); // "CloudRain"
 */
export function weatherIconName(code: number): WeatherIconName {
  if (code === 0) return "Sun";
  if (code === 1 || code === 2) return "CloudSun";
  if (code === 3) return "Cloud";
  if (code === 45 || code === 48) return "CloudFog";
  if (code >= 51 && code <= 57) return "CloudDrizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "CloudRain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snowflake";
  if (code >= 95 && code <= 99) return "CloudLightning";
  return "Cloud";
}
