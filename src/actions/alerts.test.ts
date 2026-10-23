import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAlert, resolveAlert } from "./alerts";

const { prisma, redirect, revalidatePath } = vi.hoisted(() => ({
  prisma: {
    hazardAlert: { create: vi.fn(), updateMany: vi.fn() },
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

function form(values: Record<string, string>, zoneIds: string[]): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  for (const zoneId of zoneIds) data.append("zoneIds", zoneId);
  return data;
}

const VALID = {
  title: " Mayon raised to Alert Level 3 ",
  hazardType: "VOLCANIC_ERUPTION",
  severity: "CRITICAL",
  officialLevel: "Alert Level 3",
  description: "",
};

describe("createAlert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the alert with every chosen zone, revalidates, and redirects to it", async () => {
    prisma.hazardAlert.create.mockResolvedValue({ id: "alert-1" });
    await expect(createAlert(null, form(VALID, ["z1", "z2"]))).rejects.toThrow("NEXT_REDIRECT");
    expect(prisma.hazardAlert.create).toHaveBeenCalledWith({
      data: {
        title: "Mayon raised to Alert Level 3",
        hazardType: "VOLCANIC_ERUPTION",
        severity: "CRITICAL",
        officialLevel: "Alert Level 3",
        description: "",
        zones: { connect: [{ id: "z1" }, { id: "z2" }] },
      },
      select: { id: true },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(redirect).toHaveBeenCalledWith("/alerts/alert-1");
  });

  it("returns field errors for a missing hazard, severity, and zones without touching the database", async () => {
    const result = await createAlert(null, form({ ...VALID, hazardType: "", severity: "" }, []));
    expect(prisma.hazardAlert.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Check the highlighted fields.",
      fieldErrors: {
        hazardType: ["Choose a hazard type."],
        severity: ["Choose a severity."],
        zoneIds: ["Select at least one affected zone."],
      },
    });
  });

  it("returns a generic error when the database rejects the alert", async () => {
    prisma.hazardAlert.create.mockRejectedValue(new Error("No record found for connect"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await createAlert(null, form(VALID, ["deleted-zone"]))).toEqual({
      success: false,
      error: "Couldn't log the alert. Reload the page and try again.",
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("resolveAlert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves only an active alert, so a repeat leaves the first resolved time", async () => {
    prisma.hazardAlert.updateMany.mockResolvedValue({ count: 1 });
    expect(await resolveAlert("alert-1")).toEqual({ success: true, data: undefined });
    expect(prisma.hazardAlert.updateMany).toHaveBeenCalledWith({
      where: { id: "alert-1", status: "ACTIVE" },
      data: { status: "RESOLVED", resolvedAt: expect.any(Date) },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("returns a generic error when the database fails", async () => {
    prisma.hazardAlert.updateMany.mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await resolveAlert("alert-1")).toEqual({
      success: false,
      error: "Couldn't resolve the alert. Try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
