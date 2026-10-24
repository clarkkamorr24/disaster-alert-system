import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { DUPLICATE_PHONE_MESSAGE } from "@/lib/validation/member";

import { createMember, deleteMember } from "./members";

const { prisma, redirect, revalidatePath } = vi.hoisted(() => ({
  prisma: { member: { create: vi.fn(), delete: vi.fn() } },
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

const VALID = {
  firstName: " Juan ",
  lastName: "Dela Cruz",
  phone: "917 555 0101",
  zoneId: "zone-1",
  crops: "",
  consent: "on",
};

const duplicatePhone = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
  code: "P2002",
  clientVersion: "7",
  meta: { driverAdapterError: { cause: { constraint: { fields: ["phone"] } } } },
});

describe("createMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.member.create.mockResolvedValue({ id: "member-1" });
  });

  it("with stay=1 returns the new id without redirecting", async () => {
    const result = await createMember(null, form({ ...VALID, stay: "1" }));
    expect(result).toEqual({ success: true, data: { id: "member-1" } });
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/members", "layout");
    expect(prisma.member.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ firstName: "Juan", lastName: "Dela Cruz", phone: "+639175550101" }),
      select: { id: true },
    });
  });

  it("without stay redirects to /members", async () => {
    await expect(createMember(null, form(VALID))).rejects.toThrow("NEXT_REDIRECT");
    expect(revalidatePath).toHaveBeenCalledWith("/members", "layout");
    expect(redirect).toHaveBeenCalledWith("/members");
  });

  it.each([
    ["with stay=1", { ...VALID, stay: "1" }],
    ["without stay", VALID],
  ])("maps a duplicate phone to the phone field error %s", async (_label, values) => {
    prisma.member.create.mockRejectedValue(duplicatePhone);
    const result = await createMember(null, form(values));
    expect(result).toEqual({
      success: false,
      error: "Check the highlighted fields.",
      fieldErrors: { phone: [DUPLICATE_PHONE_MESSAGE] },
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns field errors without touching the database when consent is missing", async () => {
    const result = await createMember(null, form({ ...VALID, consent: "", stay: "1" }));
    expect(prisma.member.create).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors?.consent).toBeDefined();
  });
});

describe("deleteMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.member.delete.mockResolvedValue({ id: "member-1" });
  });

  it("with stay returns success without redirecting", async () => {
    const result = await deleteMember("member-1", "DELETE", { stay: true });
    expect(result).toEqual({ success: true, data: undefined });
    expect(prisma.member.delete).toHaveBeenCalledWith({ where: { id: "member-1" } });
    expect(revalidatePath).toHaveBeenCalledWith("/members", "layout");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("without stay redirects to /members", async () => {
    await expect(deleteMember("member-1", "DELETE")).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/members");
  });

  it("refuses anything but DELETE, even with stay", async () => {
    const result = await deleteMember("member-1", "delete", { stay: true });
    expect(result.success).toBe(false);
    expect(prisma.member.delete).not.toHaveBeenCalled();
  });
});
