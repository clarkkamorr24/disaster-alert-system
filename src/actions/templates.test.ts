import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

import { createTemplate, deleteTemplate, updateTemplate } from "./templates";

const { env, prisma, redirect, revalidatePath } = vi.hoisted(() => ({
  env: { SMS_MESSAGE_PREFIX: "Mi-isi FA:" },
  prisma: {
    messageTemplate: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/dal", () => ({ requireOfficer: vi.fn().mockResolvedValue({ id: "officer-1" }) }));
vi.mock("@/lib/env", () => ({ getEnv: () => env }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const VALID = { name: " Ashfall advisory ", hazardType: "ASHFALL", body: " {hazard} sa {zones}. " };

const duplicateName = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
  code: "P2002",
  clientVersion: "7",
  meta: { driverAdapterError: { cause: { constraint: { fields: ["name"] } } } },
});

describe("createTemplate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the parsed template, revalidates, and redirects to /templates", async () => {
    await expect(createTemplate(null, form(VALID))).rejects.toThrow("NEXT_REDIRECT");
    expect(prisma.messageTemplate.create).toHaveBeenCalledWith({
      data: { name: "Ashfall advisory", hazardType: "ASHFALL", body: "{hazard} sa {zones}." },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/templates", "layout");
    expect(redirect).toHaveBeenCalledWith("/templates");
  });

  it("treats a blank hazard type as any hazard", async () => {
    await expect(createTemplate(null, form({ ...VALID, hazardType: "" }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(prisma.messageTemplate.create).toHaveBeenCalledWith({
      data: { name: "Ashfall advisory", hazardType: undefined, body: "{hazard} sa {zones}." },
    });
  });

  it("returns a field error for an unknown placeholder without touching the database", async () => {
    const result = await createTemplate(null, form({ ...VALID, body: "{hazrd} sa {zones}" }));
    expect(prisma.messageTemplate.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Check the highlighted fields.",
      fieldErrors: {
        body: ["Unknown placeholder: {hazrd}. Use {hazard}, {level}, {zones} or {date}."],
      },
    });
  });

  it("checks the length against the configured SMS prefix", async () => {
    env.SMS_MESSAGE_PREFIX = "P".repeat(600);
    try {
      const result = await createTemplate(null, form({ ...VALID, body: "x".repeat(70) }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.fieldErrors?.body?.[0]).toMatch(/^The message is 671 characters/);
      expect(prisma.messageTemplate.create).not.toHaveBeenCalled();
    } finally {
      env.SMS_MESSAGE_PREFIX = "Mi-isi FA:";
    }
  });

  it("returns a generic error when the database fails for another reason", async () => {
    prisma.messageTemplate.create.mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await createTemplate(null, form(VALID))).toEqual({
      success: false,
      error: "Couldn't add the template. Try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps a duplicate name to a field error", async () => {
    prisma.messageTemplate.create.mockRejectedValue(duplicateName);
    expect(await createTemplate(null, form(VALID))).toEqual({
      success: false,
      error: "Check the highlighted fields.",
      fieldErrors: { name: ["A template with this name already exists."] },
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("updateTemplate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves any hazard as null and stays on the page", async () => {
    const result = await updateTemplate("tpl-1", null, form({ ...VALID, hazardType: "" }));
    expect(result).toEqual({ success: true, data: undefined });
    expect(prisma.messageTemplate.update).toHaveBeenCalledWith({
      where: { id: "tpl-1" },
      data: { name: "Ashfall advisory", hazardType: null, body: "{hazard} sa {zones}." },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/templates", "layout");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps a duplicate name to a field error", async () => {
    prisma.messageTemplate.update.mockRejectedValue(duplicateName);
    const result = await updateTemplate("tpl-1", null, form(VALID));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors?.name).toEqual(["A template with this name already exists."]);
  });

  it("returns a generic error when the template is gone", async () => {
    prisma.messageTemplate.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "7" }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await updateTemplate("deleted", null, form(VALID))).toEqual({
      success: false,
      error: "Couldn't save the template. Try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteTemplate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the template and redirects to /templates", async () => {
    await expect(deleteTemplate("tpl-1")).rejects.toThrow("NEXT_REDIRECT");
    expect(prisma.messageTemplate.delete).toHaveBeenCalledWith({ where: { id: "tpl-1" } });
    expect(revalidatePath).toHaveBeenCalledWith("/templates", "layout");
    expect(redirect).toHaveBeenCalledWith("/templates");
  });

  it("returns a generic error when the database fails", async () => {
    prisma.messageTemplate.delete.mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await deleteTemplate("tpl-1")).toEqual({
      success: false,
      error: "Couldn't delete the template. Try again.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
