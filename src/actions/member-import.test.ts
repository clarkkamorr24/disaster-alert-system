import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

import { importMembers, previewMemberImport } from "./member-import";

const { prisma, revalidatePath } = vi.hoisted(() => ({
  prisma: {
    farmZone: { findMany: vi.fn() },
    member: { findMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  },
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/dal", () => ({ requireOfficer: vi.fn().mockResolvedValue({ id: "officer-1" }) }));
vi.mock("next/cache", () => ({ revalidatePath }));

const CSV = [
  "first_name,last_name,phone,zone,crops",
  "Juan,Cruz,9171234567,purok 1,rice",
  "Ana,Reyes,09181234567,Purok 1,",
  "Leo,Santos,09191234567,Purok 9,",
  "Mia,Lim,09201234567,Purok 1,",
].join("\n");

function upload(text: string, extra: Record<string, string> = {}): FormData {
  const data = new FormData();
  data.set("file", new File([text], "members.csv", { type: "text/csv" }));
  for (const [key, value] of Object.entries(extra)) data.set(key, value);
  return data;
}

function mockDatabase(existingPhones: string[] = []) {
  prisma.farmZone.findMany.mockResolvedValue([{ id: "z1", name: "Purok 1" }]);
  prisma.member.findMany.mockResolvedValue(existingPhones.map((phone) => ({ phone })));
}

describe("previewMemberImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDatabase(["+639201234567"]);
  });

  it("counts ready rows and lists the rest without writing anything", async () => {
    expect(await previewMemberImport(null, upload(CSV))).toEqual({
      success: true,
      data: {
        validCount: 2,
        errors: [
          { row: 4, message: 'Unknown zone "Purok 9". Add it under Zones first.' },
          { row: 5, message: "Already registered." },
        ],
      },
    });
    expect(prisma.member.createMany).not.toHaveBeenCalled();
  });

  it("asks for a file when none or an empty one is sent", async () => {
    const expected = { success: false, error: "Choose a CSV file." };
    expect(await previewMemberImport(null, new FormData())).toEqual(expected);
    expect(await previewMemberImport(null, upload(""))).toEqual(expected);
  });

  it("refuses a file over the size limit before reading the database", async () => {
    const result = await previewMemberImport(null, upload("x".repeat(1_000_001)));
    expect(result).toEqual({ success: false, error: "File is too large (max 1 MB)." });
    expect(prisma.farmZone.findMany).not.toHaveBeenCalled();
  });

  it("returns a generic error when the database fails", async () => {
    prisma.farmZone.findMany.mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await previewMemberImport(null, upload(CSV))).toEqual({
      success: false,
      error: "Couldn't check the file. Try again.",
    });
  });
});

describe("importMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDatabase(["+639201234567"]);
    prisma.member.createMany.mockResolvedValue({ count: 2 });
  });

  it("requires the consent confirmation before reading the file", async () => {
    expect(await importMembers(null, upload(CSV))).toEqual({
      success: false,
      error: "Confirm that consent forms were collected.",
    });
    expect(prisma.farmZone.findMany).not.toHaveBeenCalled();
  });

  it("re-checks the file and creates only the valid rows, with consent recorded now", async () => {
    const result = await importMembers(null, upload(CSV, { consentConfirmed: "on" }));

    expect(result).toEqual({ success: true, data: { imported: 2 } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const { data } = prisma.member.createMany.mock.calls[0][0];
    expect(data).toEqual([
      {
        firstName: "Juan",
        lastName: "Cruz",
        phone: "+639171234567",
        zoneId: "z1",
        crops: "rice",
        consentAt: expect.any(Date),
      },
      {
        firstName: "Ana",
        lastName: "Reyes",
        phone: "+639181234567",
        zoneId: "z1",
        crops: undefined,
        consentAt: expect.any(Date),
      },
    ]);
    expect(data[0].consentAt).toBe(data[1].consentAt);
    expect(revalidatePath).toHaveBeenCalledWith("/members", "layout");
  });

  it("refuses when no row is ready", async () => {
    mockDatabase(["+639171234567", "+639181234567", "+639201234567"]);
    expect(await importMembers(null, upload(CSV, { consentConfirmed: "on" }))).toEqual({
      success: false,
      error: "No rows are ready to import.",
    });
    expect(prisma.member.createMany).not.toHaveBeenCalled();
  });

  it("adds nothing when a number was registered after the check", async () => {
    prisma.member.createMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7",
        meta: { driverAdapterError: { cause: { constraint: { fields: ["phone"] } } } },
      }),
    );
    expect(await importMembers(null, upload(CSV, { consentConfirmed: "on" }))).toEqual({
      success: false,
      error: "Some numbers were registered in the meantime. Check the file again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns a generic error when the database fails", async () => {
    prisma.member.createMany.mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await importMembers(null, upload(CSV, { consentConfirmed: "on" }))).toEqual({
      success: false,
      error: "Couldn't import the members. Nothing was added. Try again.",
    });
  });
});
