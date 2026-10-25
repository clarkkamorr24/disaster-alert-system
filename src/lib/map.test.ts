import { describe, expect, it } from "vitest";

import { boundaryToLatLngs, isInRings, latLngsToBoundary, MI_ISI_BOUNDS } from "@/lib/map";

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

describe("isInRings", () => {
  // An L shape: its bounding-box center (13.5, 123.5) is outside it.
  const L_SHAPE: [number, number][] = [
    [13, 123],
    [14, 123],
    [14, 123.2],
    [13.2, 123.2],
    [13.2, 124],
    [13, 124],
  ];

  it("finds points inside a concave ring and outside its notch", () => {
    expect(isInRings([L_SHAPE], 13.1, 123.5)).toBe(true);
    expect(isInRings([L_SHAPE], 13.8, 123.1)).toBe(true);
    expect(isInRings([L_SHAPE], 13.5, 123.5)).toBe(false);
  });
});

describe("boundary conversion", () => {
  const corners: [number, number][] = [
    [13.2, 123.69],
    [13.2, 123.7],
    [13.21, 123.7],
  ];

  it("closes the ring in [lng, lat] order and converts back", () => {
    const boundary = latLngsToBoundary(corners);
    expect(boundary).toEqual({
      type: "Polygon",
      coordinates: [
        [
          [123.69, 13.2],
          [123.7, 13.2],
          [123.7, 13.21],
          [123.69, 13.2],
        ],
      ],
    });
    expect(boundaryToLatLngs(boundary)).toEqual(corners);
  });
});
