import { describe, expect, it } from "vitest";

import { MI_ISI_BOUNDS } from "@/lib/map";

describe("MI_ISI_BOUNDS", () => {
  it("is the box around every boundary point", () => {
    expect(MI_ISI_BOUNDS).toEqual([
      [13.180543, 123.677037],
      [13.253206, 123.711109],
    ]);
  });

  it("contains OpenStreetMap's Mi-isi point", () => {
    const [[south, west], [north, east]] = MI_ISI_BOUNDS;
    expect(13.1952539).toBeGreaterThan(south);
    expect(13.1952539).toBeLessThan(north);
    expect(123.6886244).toBeGreaterThan(west);
    expect(123.6886244).toBeLessThan(east);
  });
});
