import { describe, expect, it } from "vitest";

import { alertInputSchema, NO_ZONES_MESSAGE } from "./alert";

const valid = {
  title: "Mayon raised to Alert Level 3",
  hazardType: "VOLCANIC_ERUPTION",
  severity: "CRITICAL",
  officialLevel: "Alert Level 3",
  description: "Evacuate the 6 km permanent danger zone.",
  zoneIds: ["z1", "z2"],
};

describe("alertInputSchema", () => {
  it("accepts a valid alert", () => {
    expect(alertInputSchema.safeParse(valid).success).toBe(true);
  });

  it("requires at least one zone", () => {
    const parsed = alertInputSchema.safeParse({ ...valid, zoneIds: [] });
    expect(parsed.success).toBe(false);
    expect(parsed.error!.issues).toEqual([
      expect.objectContaining({ path: ["zoneIds"], message: NO_ZONES_MESSAGE }),
    ]);
  });

  it("removes duplicate zone ids", () => {
    expect(alertInputSchema.parse({ ...valid, zoneIds: ["z1", "z1", "z2"] }).zoneIds).toEqual([
      "z1",
      "z2",
    ]);
  });

  it("trims the title and checks its length", () => {
    expect(alertInputSchema.parse({ ...valid, title: "  Ashfall  " }).title).toBe("Ashfall");
    expect(alertInputSchema.safeParse({ ...valid, title: " ab " }).success).toBe(false);
    expect(alertInputSchema.safeParse({ ...valid, title: "a".repeat(121) }).success).toBe(false);
  });

  it("asks for a missing hazard type and severity", () => {
    const parsed = alertInputSchema.safeParse({ ...valid, hazardType: undefined, severity: "SEVERE" });
    expect(parsed.error!.issues.map((issue) => issue.message)).toEqual([
      "Choose a hazard type.",
      "Choose a severity.",
    ]);
  });

  it("treats a blank official level as not given and caps it at 60 characters", () => {
    expect(alertInputSchema.parse({ ...valid, officialLevel: "  " }).officialLevel).toBeUndefined();
    expect(alertInputSchema.safeParse({ ...valid, officialLevel: "a".repeat(61) }).success).toBe(false);
  });

  it("allows a blank description up to 2,000 characters", () => {
    expect(alertInputSchema.parse({ ...valid, description: "" }).description).toBe("");
    expect(alertInputSchema.safeParse({ ...valid, description: "a".repeat(2001) }).success).toBe(false);
  });
});
