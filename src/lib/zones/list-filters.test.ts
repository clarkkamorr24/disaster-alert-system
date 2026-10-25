import { describe, expect, it } from "vitest";

import type { ZoneListFilters, ZoneMapPoint } from "@/types/zone";

import { filterZones, parseZoneListFilters, zoneListHref } from "./list-filters";

const DEFAULTS: ZoneListFilters = { q: "", status: null, view: "card" };

function zone(name: string, worstSeverity: ZoneMapPoint["worstSeverity"]): ZoneMapPoint {
  return {
    id: name,
    name,
    latitude: 13.19,
    longitude: 123.68,
    boundary: null,
    color: "sky",
    worstSeverity,
    activeAlertTitles: [],
    memberCount: 0,
    rainfallLevel: null,
    weatherCode: null,
    maxRainNext24h: null,
    condition: null,
  };
}

const ZONES = [zone("Purok 1", "CRITICAL"), zone("Purok 2", null), zone("Sitio Bato", "LOW")];

describe("parseZoneListFilters", () => {
  it("falls back to every zone in the card view", () => {
    expect(parseZoneListFilters({})).toEqual(DEFAULTS);
  });

  it("reads trimmed values", () => {
    expect(parseZoneListFilters({ q: " purok ", status: "CLEAR", view: "list" })).toEqual({
      q: "purok",
      status: "CLEAR",
      view: "list",
    });
  });

  it("ignores an unknown status or view", () => {
    expect(parseZoneListFilters({ status: "critical", view: "grid" })).toEqual(DEFAULTS);
  });
});

describe("filterZones", () => {
  it("keeps every zone without filters", () => {
    expect(filterZones(ZONES, DEFAULTS)).toEqual(ZONES);
  });

  it("matches the name in any case", () => {
    expect(filterZones(ZONES, { ...DEFAULTS, q: "PUROK" }).map((z) => z.name)).toEqual(["Purok 1", "Purok 2"]);
  });

  it("matches the worst severity, with CLEAR for no active alert", () => {
    expect(filterZones(ZONES, { ...DEFAULTS, status: "CLEAR" }).map((z) => z.name)).toEqual(["Purok 2"]);
    expect(filterZones(ZONES, { ...DEFAULTS, status: "LOW" }).map((z) => z.name)).toEqual(["Sitio Bato"]);
  });

  it("combines the search and the status", () => {
    expect(filterZones(ZONES, { ...DEFAULTS, q: "purok", status: "LOW" })).toEqual([]);
  });
});

describe("zoneListHref", () => {
  it("leaves out defaults", () => {
    expect(zoneListHref(DEFAULTS)).toBe("/zones");
  });

  it("keeps the search, status, and view", () => {
    expect(zoneListHref({ q: "purok 1", status: "HIGH", view: "list" })).toBe(
      "/zones?q=purok+1&status=HIGH&view=list",
    );
  });
});
