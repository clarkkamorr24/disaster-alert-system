import { describe, expect, it } from "vitest";

import { zonesLabel } from "@/lib/domain/zones-label";

describe("zonesLabel", () => {
  it("says All zones when every zone is covered", () => {
    expect(zonesLabel(["Purok 1", "Purok 2", "Purok 3", "Purok 4"], 4)).toBe("All zones");
  });

  it("sorts and joins the names otherwise", () => {
    expect(zonesLabel(["Purok 2", "Purok 1"], 4)).toBe("Purok 1, Purok 2");
  });

  it("sorts numbers in names by value", () => {
    expect(zonesLabel(["Purok 10", "Purok 2"], 12)).toBe("Purok 2, Purok 10");
  });

  it("is a dash without zones", () => {
    expect(zonesLabel([], 4)).toBe("—");
  });
});
