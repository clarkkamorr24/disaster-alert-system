import { describe, expect, it } from "vitest";

import { findUnknownPlaceholders, renderTemplate } from "./render";

const DATE = new Date("2026-10-22T06:30:00Z");

describe("findUnknownPlaceholders", () => {
  it("returns names that aren't placeholders", () => {
    expect(findUnknownPlaceholders("Hi {hazrd} {zones}")).toEqual(["hazrd"]);
  });

  it("lists each unknown name once, in order", () => {
    expect(findUnknownPlaceholders("{b} {a} {b} {hazard}")).toEqual(["b", "a"]);
  });

  it("returns nothing for a body with only known placeholders", () => {
    expect(findUnknownPlaceholders("{hazard} - {level}. {zones} ({date})")).toEqual([]);
  });
});

describe("renderTemplate", () => {
  it("drops an empty level together with the preceding separator", () => {
    expect(
      renderTemplate("{hazard} - {level}. {zones}. ({date})", {
        hazard: "Lahar",
        level: "",
        zones: ["Purok 1", "Purok 2"],
        date: DATE,
      }),
    ).toBe("Lahar. Purok 1, Purok 2. (Oct 22, 2:30 PM)");
  });

  it("keeps the separator when the value is present", () => {
    expect(
      renderTemplate("{hazard} - {level}", {
        hazard: "Typhoon",
        level: "Signal No. 2",
        zones: [],
        date: new Date(),
      }),
    ).toBe("Typhoon - Signal No. 2");
  });

  it("applies the separator rule to any empty value, not only the level", () => {
    expect(
      renderTemplate("{hazard} - {zones}. {level}!", {
        hazard: "Ashfall",
        level: "",
        zones: [],
        date: DATE,
      }),
    ).toBe("Ashfall. !");
  });

  it("fills every occurrence and leaves unknown placeholders as written", () => {
    expect(
      renderTemplate("{zones}: {hazard} {oops} {zones}", {
        hazard: "Flood",
        level: "",
        zones: ["Purok 3"],
        date: DATE,
      }),
    ).toBe("Purok 3: Flood {oops} Purok 3");
  });

  it("formats the date in Philippine time with plain spaces", () => {
    const text = renderTemplate("{date}", {
      hazard: "",
      level: "",
      zones: [],
      date: new Date("2026-10-21T16:05:00Z"),
    });
    expect(text).toBe("Oct 22, 12:05 AM");
  });
});
