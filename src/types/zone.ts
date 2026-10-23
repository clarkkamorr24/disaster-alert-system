import type { Severity } from "@/generated/prisma/enums";
import type { RainfallLevel } from "@/types/weather";

/** A saved zone, as the edit form needs it. */
export interface ZoneFormValues {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
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
  /** `null` when no active alert affects the zone. */
  worstSeverity: Severity | null;
  activeAlertTitles: string[];
  memberCount: number;
  /** `null` when the weather is unavailable. */
  rainfallLevel: RainfallLevel | null;
}
