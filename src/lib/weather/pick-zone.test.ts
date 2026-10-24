import { describe, expect, it } from "vitest";

import type { ZoneWeather } from "@/types/weather";

import { pickConditionsZone } from "./pick-zone";

function weather(maxRainNext24h: number): ZoneWeather {
  return {
    tempC: 26,
    precipMm: 0,
    windKmh: 10,
    weatherCode: 61,
    maxRainNext24h,
    rainfallLevel: "NONE",
    fetchedAt: "2026-10-24T08:00",
  };
}

const ZONES = [
  { id: "a", name: "Purok 1" },
  { id: "b", name: "Purok 2" },
  { id: "c", name: "Purok 3" },
];

describe("pickConditionsZone", () => {
  it("picks the zone with the heaviest rain forecast", () => {
    const result = pickConditionsZone(ZONES, { a: weather(2), b: weather(12.6), c: weather(4) });
    expect(result?.id).toBe("b");
  });

  it("breaks a tie by name, whatever the input order", () => {
    const reversed = [...ZONES].reverse();
    const result = pickConditionsZone(reversed, { a: weather(5), b: weather(1), c: weather(5) });
    expect(result?.id).toBe("a");
  });

  it("skips zones without weather", () => {
    expect(pickConditionsZone(ZONES, { a: null, b: weather(0), c: null })?.id).toBe("b");
  });

  it("returns null when no zone has weather", () => {
    expect(pickConditionsZone(ZONES, { a: null, b: null, c: null })).toBeNull();
  });

  it("returns null for no zones", () => {
    expect(pickConditionsZone([], {})).toBeNull();
  });
});
