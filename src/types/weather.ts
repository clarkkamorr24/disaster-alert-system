/** A PAGASA rainfall warning level for an hourly rain rate. */
export type RainfallLevel = "NONE" | "YELLOW" | "ORANGE" | "RED";

/** Current weather and the next 24 hours of rain for one zone. */
export interface ZoneWeather {
  tempC: number;
  /** Rain in the current 15-minute interval, in mm. */
  precipMm: number;
  windKmh: number;
  /** WMO weather interpretation code. */
  weatherCode: number;
  /** Heaviest hourly rain in the next 24 hours, in mm. */
  maxRainNext24h: number;
  /** {@link RainfallLevel} of `maxRainNext24h`. */
  rainfallLevel: RainfallLevel;
  /** Open-Meteo's `current.time`: Manila local time without an offset, e.g. `2026-10-23T18:30`. */
  fetchedAt: string;
}
