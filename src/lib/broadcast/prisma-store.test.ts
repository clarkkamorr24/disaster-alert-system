import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { createPrismaBroadcastStore } from "@/lib/broadcast/prisma-store";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    broadcast: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    broadcastRecipient: { updateMany: vi.fn((args: unknown) => args), findUnique: vi.fn() },
    $transaction: vi.fn(async (operations: unknown[]) => operations),
  },
}));
vi.mock("@/lib/db", () => ({ prisma }));

const INPUT = {
  idempotencyKey: "key-1",
  content: "Mi-isi FA: Lahar warning",
  alertId: "alert-1",
  retryOfId: null,
  templateId: "t1",
  senderId: "Unisoft",
  creditsPerRecipient: 1,
  recipients: [{ memberId: "m1", phone: "0917 123 4567", name: "Ana Cruz" }],
};

function uniqueViolation(index: string) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7",
    meta: { driverAdapterError: { cause: { constraint: { index } } } },
  });
}

describe("createPrismaBroadcastStore", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("create", () => {
    it("creates the broadcast with its template and recipients, phones normalized", async () => {
      prisma.broadcast.create.mockResolvedValue({ id: "b1" });

      await expect(createPrismaBroadcastStore().create(INPUT)).resolves.toEqual({ id: "b1", created: true });

      expect(prisma.broadcast.create).toHaveBeenCalledWith({
        data: {
          idempotencyKey: "key-1",
          content: "Mi-isi FA: Lahar warning",
          senderId: "Unisoft",
          creditsPerRecipient: 1,
          alertId: "alert-1",
          retryOfId: null,
          templateId: "t1",
          recipients: { createMany: { data: [{ memberId: "m1", phone: "+639171234567", name: "Ana Cruz" }] } },
        },
        select: { id: true },
      });
    });

    it("returns the existing broadcast when a concurrent submit used the key first", async () => {
      prisma.broadcast.create.mockRejectedValue(uniqueViolation("broadcast_idempotencyKey_key"));
      prisma.broadcast.findUnique.mockResolvedValue({ id: "b-existing" });

      await expect(createPrismaBroadcastStore().create(INPUT)).resolves.toEqual({
        id: "b-existing",
        created: false,
      });
      expect(prisma.broadcast.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey: "key-1" },
        select: { id: true },
      });
    });

    it("rethrows any other error", async () => {
      const error = uniqueViolation("broadcast_recipient_broadcastId_phone_key");
      prisma.broadcast.create.mockRejectedValue(error);

      await expect(createPrismaBroadcastStore().create(INPUT)).rejects.toBe(error);
    });
  });

  describe("updateRecipients", () => {
    it("updates recipients with the same status and reason in one query, phones normalized", async () => {
      await createPrismaBroadcastStore().updateRecipients("b1", [
        { phone: "09171234567", status: "FAILED", failReason: "timeout" },
        { phone: "+639181234567", status: "FAILED", failReason: "timeout" },
        { phone: "09191234567", status: "SKIPPED", failReason: "unreachable" },
      ]);

      expect(prisma.broadcastRecipient.updateMany.mock.calls).toEqual([
        [
          {
            where: { broadcastId: "b1", phone: { in: ["+639171234567", "+639181234567"] }, status: { in: ["PENDING", "RETRYING"] } },
            data: { status: "FAILED", failReason: "timeout", providerRef: undefined },
          },
        ],
        [
          {
            where: { broadcastId: "b1", phone: { in: ["+639191234567"] }, status: { in: ["PENDING", "RETRYING"] } },
            data: { status: "SKIPPED", failReason: "unreachable", providerRef: undefined },
          },
        ],
      ]);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("keeps updates that leave the fail reason apart from updates that clear it", async () => {
      await createPrismaBroadcastStore().updateRecipients("b1", [
        { phone: "09171234567", status: "RETRYING" },
        { phone: "09181234567", status: "RETRYING", failReason: null },
      ]);

      expect(prisma.broadcastRecipient.updateMany.mock.calls).toEqual([
        [
          {
            where: { broadcastId: "b1", phone: { in: ["+639171234567"] }, status: { in: ["PENDING", "RETRYING"] } },
            data: { status: "RETRYING", failReason: undefined, providerRef: undefined },
          },
        ],
        [
          {
            where: { broadcastId: "b1", phone: { in: ["+639181234567"] }, status: { in: ["PENDING", "RETRYING"] } },
            data: { status: "RETRYING", failReason: null, providerRef: undefined },
          },
        ],
      ]);
    });

    it("updates each recipient with a provider reference on its own", async () => {
      await createPrismaBroadcastStore().updateRecipients("b1", [
        { phone: "09171234567", status: "SENT", providerRef: "msg_1" },
        { phone: "09181234567", status: "SENT", providerRef: "msg_2" },
      ]);

      expect(prisma.broadcastRecipient.updateMany).toHaveBeenCalledTimes(2);
    });

    it("does nothing for an empty list", async () => {
      await createPrismaBroadcastStore().updateRecipients("b1", []);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("getRecipientStatus", () => {
    it("looks the recipient up by broadcast and canonical phone", async () => {
      prisma.broadcastRecipient.findUnique.mockResolvedValue({ status: "RETRYING" });

      await expect(createPrismaBroadcastStore().getRecipientStatus("b1", "09171234567")).resolves.toBe("RETRYING");
      expect(prisma.broadcastRecipient.findUnique).toHaveBeenCalledWith({
        where: { broadcastId_phone: { broadcastId: "b1", phone: "+639171234567" } },
        select: { status: true },
      });
    });

    it("returns null for an unknown recipient", async () => {
      prisma.broadcastRecipient.findUnique.mockResolvedValue(null);
      await expect(createPrismaBroadcastStore().getRecipientStatus("b1", "+639171234567")).resolves.toBeNull();
    });
  });

  it("appends a blast id", async () => {
    await createPrismaBroadcastStore().addBlastId("b1", "blast-1");
    expect(prisma.broadcast.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { blastIds: { push: "blast-1" } },
    });
  });
});
