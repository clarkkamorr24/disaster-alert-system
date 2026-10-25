import { describe, expect, it } from "vitest";

import { firstUnusedZoneColor, toZoneColor } from "./zone-colors";

describe("firstUnusedZoneColor", () => {
  it("skips colors other zones use and ignores null", () => {
    expect(firstUnusedZoneColor([])).toBe("sky");
    expect(firstUnusedZoneColor(["sky", null, "indigo"])).toBe("blue");
  });

  it("starts over once every color is taken", () => {
    expect(
      firstUnusedZoneColor(["sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "cyan"]),
    ).toBe("sky");
  });
});

describe("toZoneColor", () => {
  it("keeps a known color and falls back for null, unknown, and prototype keys", () => {
    expect(toZoneColor("pink")).toBe("pink");
    expect(toZoneColor(null)).toBe("sky");
    expect(toZoneColor("red")).toBe("sky");
    expect(toZoneColor("toString")).toBe("sky");
  });
});
