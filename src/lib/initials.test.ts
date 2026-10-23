import { describe, expect, it } from "vitest";

import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("uses the first letters of the first and last words", () => {
    expect(initialsOf("Maria Reyes")).toBe("MR");
    expect(initialsOf("Juan Dela Cruz")).toBe("JC");
  });

  it("uppercases a single word", () => {
    expect(initialsOf("maria")).toBe("M");
  });

  it("falls back to O for a blank name", () => {
    expect(initialsOf("  ")).toBe("O");
  });
});
