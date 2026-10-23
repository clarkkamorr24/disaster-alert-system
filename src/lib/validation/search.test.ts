import { describe, expect, it } from "vitest";

import { searchQuerySchema } from "./search";

describe("searchQuerySchema", () => {
  it("rejects a single character", () => {
    expect(searchQuerySchema.safeParse("a").success).toBe(false);
  });

  it("trims the query", () => {
    expect(searchQuerySchema.parse("  ab ")).toBe("ab");
  });

  it("rejects more than 60 characters", () => {
    expect(searchQuerySchema.safeParse("a".repeat(61)).success).toBe(false);
  });
});
