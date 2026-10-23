import { describe, expect, it } from "vitest";

import { weatherIconName } from "@/lib/weather/icons";

describe("weatherIconName", () => {
  it.each([
    [0, "Sun"],
    [2, "CloudSun"],
    [3, "Cloud"],
    [45, "CloudFog"],
    [53, "CloudDrizzle"],
    [63, "CloudRain"],
    [73, "Snowflake"],
    [81, "CloudRain"],
    [95, "CloudLightning"],
  ])("maps code %i to %s", (code, name) => {
    expect(weatherIconName(code)).toBe(name);
  });

  it("falls back to Cloud for unknown codes", () => {
    expect(weatherIconName(42)).toBe("Cloud");
  });
});
