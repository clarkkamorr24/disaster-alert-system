import { describe, expect, it } from "vitest";

import { formatCoordinates } from "./coordinates";

describe("formatCoordinates", () => {
  it("rounds to three decimals with N and E", () => {
    expect(formatCoordinates(13.1432, 123.7121)).toBe("13.143° N, 123.712° E");
  });

  it("uses S and W for negative values, keeping trailing zeros", () => {
    expect(formatCoordinates(-8.5, -70.25)).toBe("8.500° S, 70.250° W");
  });
});
