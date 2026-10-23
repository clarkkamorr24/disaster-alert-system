import type { Severity } from "@/generated/prisma/enums";
import { worstSeverity } from "@/lib/domain/hazards";
import type { ZoneStatus } from "@/types/zone";

/** An active alert, reduced to what zone status needs. */
export interface ActiveAlertSummary {
  id: string;
  severity: Severity;
  zoneIds: string[];
}

/**
 * Works out, for each zone, which active alerts affect it and the worst
 * severity among them. This is what colors a zone on the map.
 *
 * @param zoneIds - The zones to report on; the output follows this order.
 * @param activeAlerts - Active alerts; each zone's `activeAlertIds` keeps this order.
 * @returns One status per zone, with `worstSeverity: null` for a clear zone.
 *
 * @example
 * computeZoneStatuses(["z1", "z2"], [{ id: "a1", severity: "HIGH", zoneIds: ["z1"] }]);
 * // [{ zoneId: "z1", worstSeverity: "HIGH", activeAlertIds: ["a1"] },
 * //  { zoneId: "z2", worstSeverity: null, activeAlertIds: [] }]
 */
export function computeZoneStatuses(
  zoneIds: string[],
  activeAlerts: ActiveAlertSummary[],
): ZoneStatus[] {
  return zoneIds.map((zoneId) => {
    const affecting = activeAlerts.filter((alert) => alert.zoneIds.includes(zoneId));
    return {
      zoneId,
      worstSeverity: worstSeverity(affecting.map((alert) => alert.severity)),
      activeAlertIds: affecting.map((alert) => alert.id),
    };
  });
}
