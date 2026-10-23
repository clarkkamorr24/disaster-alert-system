import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchEverything } from "./search";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    member: { findMany: vi.fn() },
    hazardAlert: { findMany: vi.fn() },
    broadcast: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/dal", () => ({ requireOfficer: vi.fn().mockResolvedValue({ id: "officer-1" }) }));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ SMS_MESSAGE_PREFIX: "Mi-isi FA:" }) }));

describe("searchEverything", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.member.findMany.mockResolvedValue([]);
    prisma.hazardAlert.findMany.mockResolvedValue([]);
    prisma.broadcast.findMany.mockResolvedValue([]);
  });

  it("rejects a one-character query without touching the database", async () => {
    const result = await searchEverything(" a ");
    expect(result.success).toBe(false);
    expect(prisma.member.findMany).not.toHaveBeenCalled();
    expect(prisma.hazardAlert.findMany).not.toHaveBeenCalled();
    expect(prisma.broadcast.findMany).not.toHaveBeenCalled();
  });

  it("matches members by phone digits or zone name, in any status", async () => {
    await searchEverything("0917 123");
    const [byMember, byZone] = prisma.member.findMany.mock.calls[0][0].where.OR;
    expect(byMember.isActive).toBeUndefined();
    expect(byMember.OR).toContainEqual({ phone: { contains: "917123" } });
    expect(byZone).toEqual({ zone: { name: { contains: "0917 123", mode: "insensitive" } } });
  });

  it("asks for 5 results per group and titles broadcasts", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        id: "m1",
        firstName: "Ana",
        lastName: "Cruz",
        phone: "+639171234567",
        isActive: true,
        zone: { name: "Purok 1" },
      },
    ]);
    prisma.broadcast.findMany.mockResolvedValue([
      { id: "b1", content: "Mi-isi FA: Lahar warning", createdAt: new Date(0), alert: { title: "Lahar on Purok 1" } },
      { id: "b2", content: "Mi-isi FA: Meeting on Friday", createdAt: new Date(0), alert: null },
    ]);

    const result = await searchEverything("purok");

    for (const model of [prisma.member, prisma.hazardAlert, prisma.broadcast]) {
      expect(model.findMany.mock.calls[0][0].take).toBe(5);
    }
    expect(result).toEqual({
      success: true,
      data: {
        members: [
          { id: "m1", name: "Ana Cruz", phone: "0917 123 4567", zoneName: "Purok 1", isActive: true },
        ],
        alerts: [],
        broadcasts: [
          { id: "b1", title: "Lahar on Purok 1", createdAt: new Date(0) },
          { id: "b2", title: "Meeting on Friday", createdAt: new Date(0) },
        ],
      },
    });
  });

  it("returns a friendly error when the database fails", async () => {
    prisma.hazardAlert.findMany.mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await searchEverything("purok")).toEqual({
      success: false,
      error: "Search is unavailable. Try again.",
    });
  });
});
