import { describe, expect, it } from "vitest";

import { parsePageSize } from "./pagination";

describe("parsePageSize", () => {
  it("accepts each offered size", () => {
    for (const size of [10, 25, 50, 100]) expect(parsePageSize(String(size), 25)).toBe(size);
  });

  it("falls back for missing, unknown, or malformed values", () => {
    for (const value of ["", "30", "1000", "0", "-10", "25.5", "abc"]) expect(parsePageSize(value, 50)).toBe(50);
  });
});
