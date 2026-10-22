import { describe, expect, it } from "vitest";

import { HazardType, Severity } from "@/generated/prisma/enums";
import { HAZARD_TYPES, SEVERITIES, worstSeverity } from "@/lib/domain/hazards";

describe("HAZARD_TYPES", () => {
  it("has one entry per HazardType enum value", () => {
    expect(Object.keys(HAZARD_TYPES).sort()).toEqual(Object.values(HazardType).sort());
  });

  it("offers PHIVOLCS Alert Level 0 to 5 for volcanic eruptions", () => {
    expect(HAZARD_TYPES.VOLCANIC_ERUPTION.levelSuggestions).toEqual([
      "Alert Level 0",
      "Alert Level 1",
      "Alert Level 2",
      "Alert Level 3",
      "Alert Level 4",
      "Alert Level 5",
    ]);
  });
});

describe("SEVERITIES", () => {
  it("has one entry per Severity enum value", () => {
    expect(Object.keys(SEVERITIES).sort()).toEqual(Object.values(Severity).sort());
  });

  it("ranks Low to Critical as 1 to 4", () => {
    expect(Object.values(Severity).map((severity) => SEVERITIES[severity].rank)).toEqual([
      1, 2, 3, 4,
    ]);
  });
});

describe("worstSeverity", () => {
  it("returns the highest-ranked severity", () => {
    expect(worstSeverity(["LOW", "CRITICAL", "MODERATE"])).toBe("CRITICAL");
  });

  it("handles a single severity and duplicates", () => {
    expect(worstSeverity(["MODERATE"])).toBe("MODERATE");
    expect(worstSeverity(["HIGH", "LOW", "HIGH"])).toBe("HIGH");
  });

  it("returns null for an empty list", () => {
    expect(worstSeverity([])).toBeNull();
  });
});
