import { describe, expect, it } from "vitest";

import { usageLabel } from "./usage";

describe("usageLabel", () => {
  it("labels zero, one, and many uses", () => {
    expect(usageLabel(0)).toBe("Not used yet");
    expect(usageLabel(1)).toBe("Used once");
    expect(usageLabel(7)).toBe("Used 7 times");
  });

  it("groups thousands", () => {
    expect(usageLabel(1200)).toBe("Used 1,200 times");
  });
});
