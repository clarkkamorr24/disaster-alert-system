import { describe, expect, it } from "vitest";

import { copyName } from "./copy-name";

describe("copyName", () => {
  it("adds (copy) to a free name", () => {
    expect(copyName("All clear", ["All clear"])).toBe("All clear (copy)");
  });

  it("numbers the copy when (copy) is taken", () => {
    expect(copyName("All clear", ["All clear", "All clear (copy)"])).toBe("All clear (copy 2)");
  });

  it("numbers from the original name when copying a copy", () => {
    expect(copyName("All clear (copy)", ["All clear", "All clear (copy)", "All clear (copy 2)"])).toBe(
      "All clear (copy 3)",
    );
  });

  it("only strips a copy suffix at the end", () => {
    expect(copyName("Lahar (copy) notice", [])).toBe("Lahar (copy) notice (copy)");
  });

  it("cuts a long name so the result stays within 60 characters", () => {
    const name = "A".repeat(58);
    const result = copyName(name, [name]);
    expect(result).toBe(`${"A".repeat(53)} (copy)`);
    expect(result.length).toBeLessThanOrEqual(60);
  });

  it("keeps a cut name within 60 characters when it needs a number", () => {
    const name = "A".repeat(58);
    const result = copyName(name, [name, `${"A".repeat(53)} (copy)`]);
    expect(result).toBe(`${"A".repeat(51)} (copy 2)`);
  });
});
