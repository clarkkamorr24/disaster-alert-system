import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import type { AlertSendInput } from "@/types/alert";

import { createAlertAndSend, resolveAlert } from "./alerts";

const { env, prisma, gateway, store, sendBroadcast, redirect, revalidatePath } = vi.hoisted(() => ({
  env: { SMS_MESSAGE_PREFIX: "Mi-isi FA:", UNISMS_SENDER_ID: "Unisoft" },
  prisma: {
    member: { findMany: vi.fn() },
    hazardAlert: { create: vi.fn(), findUniqueOrThrow: vi.fn(), updateMany: vi.fn() },
    messageTemplate: { findUnique: vi.fn() },
  },
  gateway: { blast: vi.fn(), getBlastMessages: vi.fn(), getCreditBalance: vi.fn() },
  store: { findIdByIdempotencyKey: vi.fn(), create: vi.fn(), addBlastId: vi.fn(), updateRecipients: vi.fn() },
  sendBroadcast: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/dal", () => ({ requireOfficer: vi.fn().mockResolvedValue({ id: "officer-1" }) }));
vi.mock("@/lib/env", () => ({ DEFAULT_SENDER_ID: "Unisoft", getEnv: () => env }));
vi.mock("@/lib/sms", () => ({ getSmsGateway: () => gateway }));
vi.mock("@/lib/broadcast/prisma-store", () => ({ createPrismaBroadcastStore: () => store }));
vi.mock("@/lib/broadcast/send", () => ({ sendBroadcast }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));

const KEY = "4f9c2a7e-1b3d-4c5e-8f60-123456789abc";
const VALID: AlertSendInput = {
  idempotencyKey: KEY,
  title: " Mayon raised to Alert Level 3 ",
  hazardType: "VOLCANIC_ERUPTION",
  severity: "CRITICAL",
  officialLevel: "Alert Level 3",
  description: "",
  zoneIds: ["z1", "z2"],
  send: true,
  content: "Lumikas na",
};
const MEMBERS = [
  { id: "m1", firstName: "Ana", lastName: "Cruz", phone: "+639171234567" },
  { id: "m2", firstName: "Ben", lastName: "Reyes", phone: "+639181234567" },
];
const duplicateKey = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
  code: "P2002",
  clientVersion: "7",
  meta: { target: ["idempotencyKey"] },
});

describe("createAlertAndSend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.findIdByIdempotencyKey.mockResolvedValue(null);
    prisma.member.findMany.mockResolvedValue(MEMBERS);
    prisma.hazardAlert.create.mockResolvedValue({ id: "alert-1" });
    gateway.getCreditBalance.mockResolvedValue(1000);
    sendBroadcast.mockResolvedValue({ broadcastId: "b1", duplicate: false });
  });

  it("without SMS, logs the alert with its key and zones and opens it, without the gateway", async () => {
    await expect(createAlertAndSend({ ...VALID, send: false, content: "" })).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.hazardAlert.create).toHaveBeenCalledWith({
      data: {
        idempotencyKey: KEY,
        title: "Mayon raised to Alert Level 3",
        hazardType: "VOLCANIC_ERUPTION",
        severity: "CRITICAL",
        officialLevel: "Alert Level 3",
        description: "",
        zones: { connect: [{ id: "z1" }, { id: "z2" }] },
      },
      select: { id: true },
    });
    expect(gateway.getCreditBalance).not.toHaveBeenCalled();
    expect(sendBroadcast).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(redirect).toHaveBeenCalledWith("/alerts/alert-1");
  });

  it("saves the template the SMS started from", async () => {
    prisma.messageTemplate.findUnique.mockResolvedValue({ id: "t1" });

    await expect(createAlertAndSend({ ...VALID, templateId: "t1" })).rejects.toThrow("NEXT_REDIRECT");

    expect(sendBroadcast.mock.calls[0][0]).toMatchObject({ templateId: "t1" });
  });

  it("with SMS, sends to the zones' active members linked to the alert, then opens the report", async () => {
    await expect(createAlertAndSend(VALID)).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true, zoneId: { in: ["z1", "z2"] } } }),
    );
    expect(sendBroadcast).toHaveBeenCalledTimes(1);
    expect(sendBroadcast.mock.calls[0][0]).toEqual({
      idempotencyKey: KEY,
      content: "Mi-isi FA: Lumikas na",
      alertId: "alert-1",
      retryOfId: null,
      templateId: null,
      recipients: [
        { memberId: "m1", phone: "+639171234567", name: "Ana Cruz" },
        { memberId: "m2", phone: "+639181234567", name: "Ben Reyes" },
      ],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/broadcasts", "layout");
    expect(redirect).toHaveBeenCalledWith("/broadcasts/b1");
  });

  it("reuses the alert the same key already logged", async () => {
    prisma.hazardAlert.create.mockRejectedValue(duplicateKey);
    prisma.hazardAlert.findUniqueOrThrow.mockResolvedValue({ id: "alert-existing" });

    await expect(createAlertAndSend({ ...VALID, send: false })).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.hazardAlert.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { idempotencyKey: KEY },
      select: { id: true },
    });
    expect(redirect).toHaveBeenCalledWith("/alerts/alert-existing");
  });

  it("opens the existing report when the key's broadcast was already sent", async () => {
    store.findIdByIdempotencyKey.mockResolvedValue("b-existing");

    await expect(createAlertAndSend(VALID)).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.hazardAlert.create).not.toHaveBeenCalled();
    expect(sendBroadcast).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/broadcasts/b-existing");
  });

  it.each([
    ["an emoji in the message", { content: "Lindol 🌋" }, "Remove unsupported characters: 🌋"],
    ["an empty message", { content: " " }, "Message is empty."],
  ])("refuses %s and logs nothing", async (_case, change, error) => {
    expect(await createAlertAndSend({ ...VALID, ...change })).toEqual({ success: false, error });
    expect(prisma.hazardAlert.create).not.toHaveBeenCalled();
  });

  it("refuses zones without active members and logs nothing", async () => {
    prisma.member.findMany.mockResolvedValue([]);
    expect(await createAlertAndSend(VALID)).toEqual({
      success: false,
      error: "No active members in the selected zones.",
    });
    expect(prisma.hazardAlert.create).not.toHaveBeenCalled();
  });

  it("refuses a send that costs more than the balance and logs nothing", async () => {
    gateway.getCreditBalance.mockResolvedValue(1);
    expect(await createAlertAndSend(VALID)).toEqual({
      success: false,
      error: "Not enough SMS credits. Top up UniSMS first.",
    });
    expect(prisma.hazardAlert.create).not.toHaveBeenCalled();
  });

  it("returns field errors without touching the database", async () => {
    const result = await createAlertAndSend({ ...VALID, hazardType: null, severity: null, zoneIds: [] });
    expect(result).toEqual({
      success: false,
      error: "Check the highlighted fields.",
      fieldErrors: {
        hazardType: ["Choose a hazard type."],
        severity: ["Choose a severity."],
        zoneIds: ["Select at least one affected zone."],
      },
    });
    expect(prisma.hazardAlert.create).not.toHaveBeenCalled();
    expect(store.findIdByIdempotencyKey).not.toHaveBeenCalled();
  });

  it("returns a send failure with the logged alert, and a retry reuses it and sends once", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sendBroadcast.mockRejectedValueOnce(new Error("connection lost"));

    expect(await createAlertAndSend(VALID)).toEqual({
      success: false,
      error: "Something went wrong while sending. Press Send again: no member gets the message twice.",
      alertId: "alert-1",
    });
    expect(redirect).not.toHaveBeenCalled();
    // A refresh would remount the form with a new key, so a retry would log a second alert.
    expect(revalidatePath).not.toHaveBeenCalled();

    prisma.hazardAlert.create.mockRejectedValue(duplicateKey);
    prisma.hazardAlert.findUniqueOrThrow.mockResolvedValue({ id: "alert-1" });
    await expect(createAlertAndSend(VALID)).rejects.toThrow("NEXT_REDIRECT");

    expect(sendBroadcast).toHaveBeenCalledTimes(2);
    expect(sendBroadcast.mock.calls[1][0]).toMatchObject({ idempotencyKey: KEY, alertId: "alert-1" });
    expect(redirect).toHaveBeenCalledWith("/broadcasts/b1");
  });

  it("returns the send's own refusal with the logged alert, without revalidating", async () => {
    // The balance drops between the check before logging and the send's own check.
    gateway.getCreditBalance.mockResolvedValueOnce(1000).mockResolvedValueOnce(1);

    expect(await createAlertAndSend(VALID)).toEqual({
      success: false,
      error: "Not enough SMS credits. Top up UniSMS first.",
      alertId: "alert-1",
    });
    expect(sendBroadcast).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns a generic error when a different unique field fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prisma.hazardAlert.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7",
        meta: { target: ["title"] },
      }),
    );

    expect(await createAlertAndSend({ ...VALID, send: false })).toEqual({
      success: false,
      error: "Couldn't log the alert. Reload the page and try again.",
    });
    expect(prisma.hazardAlert.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("returns a generic error when the alert can't be logged", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prisma.hazardAlert.create.mockRejectedValue(new Error("No record found for connect"));

    expect(await createAlertAndSend(VALID)).toEqual({
      success: false,
      error: "Couldn't log the alert. Reload the page and try again.",
    });
    expect(sendBroadcast).not.toHaveBeenCalled();
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
