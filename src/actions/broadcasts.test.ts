import { beforeEach, describe, expect, it, vi } from "vitest";

import { SmsGatewayError } from "@/types/sms";

import { refreshBroadcastStatus, sendBroadcastAction } from "./broadcasts";

const { env, prisma, gateway, store, sendBroadcast, redirect, revalidatePath } = vi.hoisted(() => ({
  env: { SMS_MESSAGE_PREFIX: "Mi-isi FA:", UNISMS_SENDER_ID: "Unisoft" },
  prisma: {
    member: { findMany: vi.fn() },
    hazardAlert: { findUnique: vi.fn() },
    broadcast: { findUnique: vi.fn() },
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
const VALID = { idempotencyKey: KEY, content: "Lahar warning", alertId: "alert-1", zoneIds: ["z1", "z2"] };
const MEMBERS = [
  { id: "m1", firstName: "Ana", lastName: "Cruz", phone: "+639171234567" },
  { id: "m2", firstName: "Ben", lastName: "Reyes", phone: "+639181234567" },
];

describe("sendBroadcastAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.UNISMS_SENDER_ID = "Unisoft";
    store.findIdByIdempotencyKey.mockResolvedValue(null);
    prisma.member.findMany.mockResolvedValue(MEMBERS);
    prisma.hazardAlert.findUnique.mockResolvedValue({ id: "alert-1" });
    gateway.getCreditBalance.mockResolvedValue(1000);
    sendBroadcast.mockResolvedValue({ broadcastId: "b1", duplicate: false });
  });

  it("sends the prefixed message to the zones' active members, then opens the report", async () => {
    await expect(sendBroadcastAction(VALID)).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true, zoneId: { in: ["z1", "z2"] } } }),
    );
    expect(sendBroadcast).toHaveBeenCalledWith(
      {
        idempotencyKey: KEY,
        content: "Mi-isi FA: Lahar warning",
        alertId: "alert-1",
        retryOfId: null,
        recipients: [
          { memberId: "m1", phone: "+639171234567", name: "Ana Cruz" },
          { memberId: "m2", phone: "+639181234567", name: "Ben Reyes" },
        ],
      },
      { gateway, store, senderId: "Unisoft" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/broadcasts", "layout");
    expect(redirect).toHaveBeenCalledWith("/broadcasts/b1");
  });

  it("sanitizes smart punctuation before sending", async () => {
    await expect(sendBroadcastAction({ ...VALID, content: "“Lumikas” na – ngayon" })).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(sendBroadcast.mock.calls[0][0].content).toBe('Mi-isi FA: "Lumikas" na - ngayon');
  });

  it("opens the existing report without any checks or sending when the key was already used", async () => {
    store.findIdByIdempotencyKey.mockResolvedValue("b-existing");
    gateway.getCreditBalance.mockResolvedValue(0);

    await expect(sendBroadcastAction(VALID)).rejects.toThrow("NEXT_REDIRECT");

    expect(sendBroadcast).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/broadcasts/b-existing");
  });

  it("rejects an idempotency key that isn't a UUID", async () => {
    const result = await sendBroadcastAction({ ...VALID, idempotencyKey: "abc" });
    expect(result).toEqual({ success: false, error: "Reload the page and try again." });
    expect(sendBroadcast).not.toHaveBeenCalled();
  });

  it("requires at least one zone", async () => {
    const result = await sendBroadcastAction({ ...VALID, zoneIds: [] });
    expect(result).toEqual({ success: false, error: "Select at least one zone." });
  });

  it("removes duplicate zone ids", async () => {
    await expect(sendBroadcastAction({ ...VALID, zoneIds: ["z1", "z1"] })).rejects.toThrow("NEXT_REDIRECT");
    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true, zoneId: { in: ["z1"] } } }),
    );
  });

  it.each([
    ["an empty message", "  ", "Message is empty."],
    ["a link with the default sender ID", "Tingnan www.example.com", "Links can't be sent with the default sender ID."],
    ["an emoji", "Lindol 🌋", "Remove unsupported characters: 🌋"],
    ["a placeholder left in", "Wala nang {hazard} sa {zones}", "Replace {hazard}, {zones} with the actual text."],
  ])("refuses %s", async (_case, content, error) => {
    const result = await sendBroadcastAction({ ...VALID, content });
    expect(result).toEqual({ success: false, error });
    expect(sendBroadcast).not.toHaveBeenCalled();
  });

  it("allows links with a registered sender ID", async () => {
    env.UNISMS_SENDER_ID = "MiisiFA";
    await expect(sendBroadcastAction({ ...VALID, content: "Tingnan www.example.com" })).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(sendBroadcast.mock.calls[0][1].senderId).toBe("MiisiFA");
  });

  it("refuses when the selected zones have no active members", async () => {
    prisma.member.findMany.mockResolvedValue([]);
    const result = await sendBroadcastAction(VALID);
    expect(result).toEqual({ success: false, error: "No active members in the selected zones." });
  });

  it("refuses when the cost exceeds the known balance", async () => {
    // 2 members × 1 credit = 2 credits.
    gateway.getCreditBalance.mockResolvedValue(1);
    const result = await sendBroadcastAction(VALID);
    expect(result).toEqual({ success: false, error: "Not enough SMS credits. Top up UniSMS first." });
    expect(sendBroadcast).not.toHaveBeenCalled();
  });

  it("sends when the cost equals the balance, or the balance is unknown", async () => {
    gateway.getCreditBalance.mockResolvedValue(2);
    await expect(sendBroadcastAction(VALID)).rejects.toThrow("NEXT_REDIRECT");
    gateway.getCreditBalance.mockResolvedValue(null);
    await expect(sendBroadcastAction(VALID)).rejects.toThrow("NEXT_REDIRECT");
    expect(sendBroadcast).toHaveBeenCalledTimes(2);
  });

  it("refuses when the alert was deleted", async () => {
    prisma.hazardAlert.findUnique.mockResolvedValue(null);
    const result = await sendBroadcastAction(VALID);
    expect(result).toEqual({ success: false, error: "This alert was deleted. Reload the page." });
  });

  it("sends a general announcement without looking up an alert", async () => {
    await expect(sendBroadcastAction({ ...VALID, alertId: null })).rejects.toThrow("NEXT_REDIRECT");
    expect(prisma.hazardAlert.findUnique).not.toHaveBeenCalled();
    expect(sendBroadcast.mock.calls[0][0].alertId).toBeNull();
  });

  it("returns a retry message when sending throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sendBroadcast.mockRejectedValue(new Error("connection lost"));

    const result = await sendBroadcastAction(VALID);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong while sending. Press Send again: no member gets the message twice.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("sendBroadcastAction with retryOfId", () => {
  const RESEND = { idempotencyKey: KEY, content: "Mi-isi FA: Lahar warning", retryOfId: "b-orig" };

  beforeEach(() => {
    vi.clearAllMocks();
    env.UNISMS_SENDER_ID = "Unisoft";
    store.findIdByIdempotencyKey.mockResolvedValue(null);
    prisma.broadcast.findUnique.mockResolvedValue({ alertId: "alert-1" });
    prisma.member.findMany.mockResolvedValue([MEMBERS[1]]);
    gateway.getCreditBalance.mockResolvedValue(1000);
    sendBroadcast.mockResolvedValue({ broadcastId: "b2", duplicate: false });
  });

  it("resends to the original's unreached active members, linked to it and its alert", async () => {
    await expect(sendBroadcastAction(RESEND)).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          recipients: { some: { broadcastId: "b-orig", status: { in: ["FAILED", "SKIPPED"] } } },
        },
      }),
    );
    expect(prisma.hazardAlert.findUnique).not.toHaveBeenCalled();
    expect(sendBroadcast.mock.calls[0][0]).toEqual({
      idempotencyKey: KEY,
      // The stored content already has the prefix; it isn't added twice.
      content: "Mi-isi FA: Lahar warning",
      alertId: "alert-1",
      retryOfId: "b-orig",
      recipients: [{ memberId: "m2", phone: "+639181234567", name: "Ben Reyes" }],
    });
    expect(redirect).toHaveBeenCalledWith("/broadcasts/b2");
  });

  it("refuses when nobody unreached is still active", async () => {
    prisma.member.findMany.mockResolvedValue([]);
    const result = await sendBroadcastAction(RESEND);
    expect(result).toEqual({
      success: false,
      error: "Nobody to resend to: the members who weren't reached are no longer active.",
    });
    expect(sendBroadcast).not.toHaveBeenCalled();
  });

  it("refuses when the original broadcast is gone", async () => {
    prisma.broadcast.findUnique.mockResolvedValue(null);
    const result = await sendBroadcastAction(RESEND);
    expect(result).toEqual({ success: false, error: "The original broadcast was deleted. Reload the page." });
  });

  it("rejects an empty original id", async () => {
    const result = await sendBroadcastAction({ ...RESEND, retryOfId: "" });
    expect(result).toEqual({ success: false, error: "Reload the page and try again." });
  });
});

describe("refreshBroadcastStatus", () => {
  const msg = (recipient: string, status: "sent" | "retrying", broadcastId = "b1") => ({
    referenceId: `msg_${recipient}`,
    recipient,
    status,
    failReason: null,
    metadata: { broadcastId },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.broadcast.findUnique.mockResolvedValue({
      blastIds: ["blast-1", "blast-2"],
      recipients: [
        { phone: "+639171234567", status: "PENDING" },
        { phone: "+639181234567", status: "PENDING" },
        { phone: "+639191234567", status: "SKIPPED" },
      ],
    });
    gateway.getBlastMessages.mockImplementation(async (blastId: string) =>
      blastId === "blast-1"
        ? [msg("09171234567", "sent"), msg("09181234567", "retrying")]
        : [msg("09191234567", "sent"), msg("09171234567", "sent", "other")],
    );
  });

  it("applies every blast's messages and saves the changes in one write", async () => {
    const result = await refreshBroadcastStatus("b1");

    expect(result).toEqual({ success: true, data: { updated: 2 } });
    expect(store.updateRecipients).toHaveBeenCalledTimes(1);
    expect(store.updateRecipients).toHaveBeenCalledWith("b1", [
      { phone: "+639171234567", status: "SENT", failReason: null, providerRef: "msg_09171234567" },
      { phone: "+639181234567", status: "RETRYING", failReason: null, providerRef: "msg_09181234567" },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/broadcasts", "layout");
  });

  it("refuses an unknown broadcast", async () => {
    prisma.broadcast.findUnique.mockResolvedValue(null);
    const result = await refreshBroadcastStatus("nope");
    expect(result).toEqual({ success: false, error: "This broadcast no longer exists." });
  });

  it("changes nothing when UniSMS can't be reached", async () => {
    gateway.getBlastMessages.mockRejectedValueOnce(new SmsGatewayError("timeout"));

    const result = await refreshBroadcastStatus("b1");

    expect(result).toEqual({ success: false, error: "Couldn't reach UniSMS. Try again." });
    expect(store.updateRecipients).not.toHaveBeenCalled();
  });

  it("returns a generic message for other errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    store.updateRecipients.mockRejectedValueOnce(new Error("connection lost"));

    const result = await refreshBroadcastStatus("b1");

    expect(result).toEqual({ success: false, error: "Couldn't refresh the status. Try again." });
  });
});
