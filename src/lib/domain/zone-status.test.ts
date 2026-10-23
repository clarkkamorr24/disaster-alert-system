import { describe, expect, it } from "vitest";

import { computeZoneStatuses } from "./zone-status";

describe("computeZoneStatuses", () => {
  it("reports each zone's worst active severity and alerts, in input order", () => {
    const statuses = computeZoneStatuses(
      ["z1", "z2", "z3"],
      [
        { id: "a1", severity: "MODERATE", zoneIds: ["z1", "z2"] },
        { id: "a2", severity: "CRITICAL", zoneIds: ["z2"] },
      ],
    );
    expect(statuses).toEqual([
      { zoneId: "z1", worstSeverity: "MODERATE", activeAlertIds: ["a1"] },
      { zoneId: "z2", worstSeverity: "CRITICAL", activeAlertIds: ["a1", "a2"] },
      { zoneId: "z3", worstSeverity: null, activeAlertIds: [] },
    ]);
  });

  it("returns an empty list for no zones", () => {
    expect(computeZoneStatuses([], [{ id: "a1", severity: "LOW", zoneIds: ["z1"] }])).toEqual([]);
  });
});
