import { describe, expect, it } from "vitest";

import { isInMiIsi, OUTSIDE_MI_ISI_MESSAGE } from "@/lib/map";

import { isInPhilippines, OUTSIDE_PHILIPPINES_MESSAGE, zoneInputSchema } from "./zone";

describe("zoneInputSchema", () => {
  it("accepts a valid zone", () => {
    expect(zoneInputSchema.safeParse({ name: "Purok 1", latitude: 13.2, longitude: 123.7 }).success).toBe(true);
  });

  it("rejects swapped coordinates with the message on latitude", () => {
    const swapped = zoneInputSchema.safeParse({ name: "P1", latitude: 123.7, longitude: 13.2 });
    expect(swapped.success).toBe(false);
    expect(swapped.error!.issues[0].message).toMatch(/swapped|Philippines/i);
    expect(swapped.error!.issues[0].path).toEqual(["latitude"]);
  });

  it("coerces form strings to numbers", () => {
    const parsed = zoneInputSchema.safeParse({ name: "P1", latitude: "13.2", longitude: " 123.7 " });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({ latitude: 13.2, longitude: 123.7 });
  });

  it("asks for a blank coordinate instead of treating it as 0", () => {
    const parsed = zoneInputSchema.safeParse({ name: "P1", latitude: "", longitude: "123.7" });
    expect(parsed.error!.issues).toEqual([
      expect.objectContaining({ path: ["latitude"], message: "Enter the latitude." }),
    ]);
  });

  it("rejects a coordinate that isn't a number", () => {
    const parsed = zoneInputSchema.safeParse({ name: "P1", latitude: "13.2", longitude: "abc" });
    expect(parsed.error!.issues).toEqual([
      expect.objectContaining({ path: ["longitude"], message: "Enter the longitude as a number." }),
    ]);
  });

  it("trims the name and enforces 2–60 characters", () => {
    const coords = { latitude: 13.2, longitude: 123.7 };
    expect(zoneInputSchema.parse({ name: "  Sitio Ilaya  ", ...coords }).name).toBe("Sitio Ilaya");
    expect(zoneInputSchema.safeParse({ name: " P ", ...coords }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ name: "x".repeat(61), ...coords }).success).toBe(false);
  });

  it("turns a blank description into undefined and caps it at 200 characters", () => {
    const coords = { name: "P1", latitude: 13.2, longitude: 123.7 };
    expect(zoneInputSchema.parse({ ...coords, description: "   " }).description).toBeUndefined();
    expect(zoneInputSchema.safeParse({ ...coords, description: "x".repeat(201) }).success).toBe(false);
  });
});

describe("isInPhilippines", () => {
  it("includes the bounds themselves", () => {
    expect(isInPhilippines(4, 116)).toBe(true);
    expect(isInPhilippines(22, 127)).toBe(true);
  });

  it("rejects points just outside each bound", () => {
    expect(isInPhilippines(3.99, 120)).toBe(false);
    expect(isInPhilippines(22.01, 120)).toBe(false);
    expect(isInPhilippines(13, 115.99)).toBe(false);
    expect(isInPhilippines(13, 127.01)).toBe(false);
  });

  it("matches the schema message", () => {
    const parsed = zoneInputSchema.safeParse({ name: "P1", latitude: 35.7, longitude: 139.7 });
    expect(parsed.error!.issues[0].message).toBe(OUTSIDE_PHILIPPINES_MESSAGE);
  });
});

describe("Barangay Mi-isi check", () => {
  it("rejects a point in the Philippines but outside Mi-isi, on latitude", () => {
    // Lidong, just east of the boundary.
    const parsed = zoneInputSchema.safeParse({ name: "P1", latitude: 13.2, longitude: 123.72 });
    expect(parsed.error!.issues).toEqual([
      expect.objectContaining({ path: ["latitude"], message: OUTSIDE_MI_ISI_MESSAGE }),
    ]);
  });

  it("finds points in both parts of the boundary and outside it", () => {
    expect(isInMiIsi(13.1953, 123.6886)).toBe(true);
    expect(isInMiIsi(13.182, 123.68)).toBe(true);
    expect(isInMiIsi(13.17, 123.66)).toBe(false);
    expect(isInMiIsi(13.26, 123.69)).toBe(false);
  });
});
