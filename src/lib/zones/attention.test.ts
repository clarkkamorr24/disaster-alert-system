import { describe, expect, it } from "vitest";

import type { ZoneMapPoint } from "@/types/zone";

import { selectAttentionZones } from "./attention";

function zone(name: string, overrides: Partial<ZoneMapPoint> = {}): ZoneMapPoint {
  return {
    id: name,
    name,
    latitude: 13.19,
    longitude: 123.68,
    boundary: null,
    color: "sky",
    worstSeverity: null,
    activeAlertTitles: [],
    memberCount: 0,
    rainfallLevel: "NONE",
    weatherCode: 1,
    maxRainNext24h: 0,
    condition: "Mainly clear",
    ...overrides,
  };
}

const names = (zones: ZoneMapPoint[]) => zones.map((z) => z.name);

describe("selectAttentionZones", () => {
  it("leaves out clear zones without rain warnings", () => {
    expect(selectAttentionZones([zone("A"), zone("B")])).toEqual([]);
  });

  it("includes High and Critical alerts, Yellow rain on a clear zone, and a zone missing weather", () => {
    const zones = [
      zone("Clear"),
      zone("Alert", { worstSeverity: "HIGH" }),
      zone("Rain", { rainfallLevel: "YELLOW", maxRainNext24h: 8 }),
      zone("No weather", { rainfallLevel: null, maxRainNext24h: null, weatherCode: null, condition: null }),
    ];
    expect(names(selectAttentionZones(zones))).toEqual(["Alert", "Rain", "No weather"]);
  });

  it("leaves out Moderate and Low alerts unless rain also applies", () => {
    const zones = [
      zone("Low", { worstSeverity: "LOW" }),
      zone("Moderate", { worstSeverity: "MODERATE" }),
      zone("Moderate rain", { worstSeverity: "MODERATE", rainfallLevel: "YELLOW", maxRainNext24h: 9 }),
    ];
    expect(names(selectAttentionZones(zones))).toEqual(["Moderate rain"]);
  });

  it("ignores missing weather when no zone has weather", () => {
    const down = { rainfallLevel: null, maxRainNext24h: null, weatherCode: null, condition: null };
    const zones = [zone("A", down), zone("B", { ...down, worstSeverity: "HIGH" })];
    expect(names(selectAttentionZones(zones))).toEqual(["B"]);
  });

  it("sorts by severity, then rain, then members, then name", () => {
    const zones = [
      zone("A", { worstSeverity: "HIGH", memberCount: 9 }),
      zone("B", { worstSeverity: "HIGH", maxRainNext24h: 3 }),
      zone("C", { worstSeverity: "CRITICAL" }),
      zone("D", { worstSeverity: "HIGH", memberCount: 9 }),
      zone("E", { rainfallLevel: "RED", maxRainNext24h: 40 }),
    ];
    expect(names(selectAttentionZones(zones))).toEqual(["C", "B", "A", "D", "E"]);
  });
});
