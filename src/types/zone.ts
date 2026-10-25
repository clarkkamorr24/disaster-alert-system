import type { Severity } from "@/generated/prisma/enums";
import type { ZoneColor } from "@/lib/zone-colors";
import type { RainfallLevel } from "@/types/weather";

/** A purok's drawn area as stored in `FarmZone.boundary`: a GeoJSON Polygon with one closed `[lng, lat]` ring. */
export interface ZoneBoundary {
  type: "Polygon";
  coordinates: [number, number][][];
}

/** A saved zone, as the edit form needs it. */
export interface ZoneFormValues {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  boundary: ZoneBoundary | null;
  /** A `ZONE_COLORS` key. */
  color: ZoneColor;
}

/** Which active alerts affect a zone, and the worst severity among them. */
export interface ZoneStatus {
  zoneId: string;
  /** `null` when no active alert affects the zone. */
  worstSeverity: Severity | null;
  /** In the order the alerts were given. */
  activeAlertIds: string[];
}

/** A zone as the dashboard map draws it. */
export interface ZoneMapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** `null` when the zone is shown as a pin only. */
  boundary: ZoneBoundary | null;
  color: ZoneColor;
  /** `null` when no active alert affects the zone. */
  worstSeverity: Severity | null;
  activeAlertTitles: string[];
  memberCount: number;
  /** `null` when the weather is unavailable (also for the fields below). */
  rainfallLevel: RainfallLevel | null;
  /** WMO weather interpretation code. */
  weatherCode: number | null;
  /** Heaviest hourly rain in the next 24 hours, in mm. */
  maxRainNext24h: number | null;
  /** The current weather in plain words, such as `Rain`. */
  condition: string | null;
}
