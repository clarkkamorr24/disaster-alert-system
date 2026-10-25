import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

import { createZone, deleteZone, updateZone } from "./zones";

const { prisma, redirect, revalidatePath } = vi.hoisted(() => ({
  prisma: {
    farmZone: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    member: { count: vi.fn() },
  },
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/dal", () => ({ requireOfficer: vi.fn().mockResolvedValue({ id: "officer-1" }) }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const VALID = { name: " Purok 4 ", description: "", latitude: "13.1953", longitude: "123.6886" };

const duplicateName = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
  code: "P2002",
  clientVersion: "7",
  meta: { driverAdapterError: { cause: { constraint: { fields: ["name"] } } } },
});

describe("createZone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the parsed zone, revalidates, and redirects to /zones", async () => {
    await expect(createZone(null, form(VALID))).rejects.toThrow("NEXT_REDIRECT");
    expect(prisma.farmZone.create).toHaveBeenCalledWith({
      data: { name: "Purok 4", description: undefined, latitude: 13.1953, longitude: 123.6886 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/zones", "layout");
    expect(redirect).toHaveBeenCalledWith("/zones");
  });

  it("returns field errors for swapped coordinates without touching the database", async () => {
    const result = await createZone(null, form({ ...VALID, latitude: "123.6886", longitude: "13.1953" }));
    expect(prisma.farmZone.create).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors?.latitude?.[0]).toMatch(/swapped/);
  });

  it("maps a duplicate name to a field error", async () => {
    prisma.farmZone.create.mockRejectedValue(duplicateName);
    const result = await createZone(null, form(VALID));
    expect(result).toEqual({
      success: false,
      error: "Check the highlighted fields.",
      fieldErrors: { name: ["A zone with this name already exists."] },
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("updateZone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves a cleared description as null and stays on the page", async () => {
    const result = await updateZone("zone-1", null, form(VALID));
    expect(result).toEqual({ success: true, data: undefined });
    expect(prisma.farmZone.update).toHaveBeenCalledWith({
      where: { id: "zone-1" },
      data: {
        name: "Purok 4",
        description: null,
        latitude: 13.1953,
        longitude: 123.6886,
        boundary: Prisma.DbNull,
        color: null,
      },
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("saves a boundary and color, and stores a cleared boundary as a database NULL", async () => {
    const boundary = {
      type: "Polygon",
      coordinates: [
        [
          [123.6866, 13.1933],
          [123.6906, 13.1933],
          [123.6906, 13.1973],
          [123.6866, 13.1973],
          [123.6866, 13.1933],
        ],
      ],
    };
    await updateZone("zone-1", null, form({ ...VALID, boundary: JSON.stringify(boundary), color: "cyan" }));
    expect(prisma.farmZone.update).toHaveBeenLastCalledWith({
      where: { id: "zone-1" },
      data: expect.objectContaining({ boundary, color: "cyan" }),
    });

    await updateZone("zone-1", null, form({ ...VALID, boundary: "", color: "" }));
    expect(prisma.farmZone.update).toHaveBeenLastCalledWith({
      where: { id: "zone-1" },
      data: expect.objectContaining({ boundary: Prisma.DbNull, color: null }),
    });
  });

  it("maps a duplicate name to a field error", async () => {
    prisma.farmZone.update.mockRejectedValue(duplicateName);
    const result = await updateZone("zone-1", null, form(VALID));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors?.name).toEqual(["A zone with this name already exists."]);
  });
});

describe("deleteZone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses while the zone has members, active or not", async () => {
    prisma.member.count.mockResolvedValue(2);
    expect(await deleteZone("zone-1")).toEqual({
      success: false,
      error: "Move or remove this zone's members first.",
    });
    expect(prisma.member.count).toHaveBeenCalledWith({ where: { zoneId: "zone-1" } });
    expect(prisma.farmZone.delete).not.toHaveBeenCalled();
  });

  it("deletes an empty zone and redirects to /zones", async () => {
    prisma.member.count.mockResolvedValue(0);
    await expect(deleteZone("zone-1")).rejects.toThrow("NEXT_REDIRECT");
    expect(prisma.farmZone.delete).toHaveBeenCalledWith({ where: { id: "zone-1" } });
    expect(redirect).toHaveBeenCalledWith("/zones");
  });

  it("returns a generic error when the database fails", async () => {
    prisma.member.count.mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await deleteZone("zone-1")).toEqual({
      success: false,
      error: "Couldn't delete the zone. Try again.",
    });
  });
});
