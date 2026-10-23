import type { Severity } from "@/generated/prisma/enums";

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
