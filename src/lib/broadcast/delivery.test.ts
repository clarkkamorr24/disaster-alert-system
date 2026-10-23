import { describe, expect, it, vi } from "vitest";

import {
  applyProviderMessage,
  createBufferedDeliveryStore,
  nextRecipientStatus,
  statusesThatCanBecome,
} from "@/lib/broadcast/delivery";
import type { RecipientStatus } from "@/generated/prisma/enums";
import type { DeliveryStore } from "@/types/broadcast";
import type { ProviderMessage } from "@/types/sms";

function message(overrides: Partial<ProviderMessage> = {}): ProviderMessage {
  return {
    referenceId: "msg_1",
    recipient: "09171234567",
    status: "sent",
    failReason: null,
    metadata: { broadcastId: "b1" },
    ...overrides,
  };
}

function storeWith(status: RecipientStatus | null) {
  return {
    getRecipientStatus: vi.fn<DeliveryStore["getRecipientStatus"]>().mockResolvedValue(status),
    updateRecipients: vi.fn<DeliveryStore["updateRecipients"]>().mockResolvedValue(undefined),
  };
}

describe("nextRecipientStatus", () => {
  it("moves forward through the ranks", () => {
    expect(nextRecipientStatus("PENDING", "retrying")).toBe("RETRYING");
    expect(nextRecipientStatus("PENDING", "sent")).toBe("SENT");
    expect(nextRecipientStatus("RETRYING", "failed")).toBe("FAILED");
    expect(nextRecipientStatus("RETRYING", "retrying")).toBe("RETRYING");
  });

  it("never moves backwards", () => {
    expect(nextRecipientStatus("RETRYING", "pending")).toBe("RETRYING");
  });

  it("keeps final statuses", () => {
    expect(nextRecipientStatus("SENT", "retrying")).toBe("SENT");
    expect(nextRecipientStatus("SENT", "failed")).toBe("SENT");
    expect(nextRecipientStatus("FAILED", "sent")).toBe("FAILED");
    expect(nextRecipientStatus("SKIPPED", "sent")).toBe("SKIPPED");
  });
});

describe("statusesThatCanBecome", () => {
  it("allows only non-final statuses ranked at or below the target", () => {
    expect(statusesThatCanBecome("PENDING")).toEqual(["PENDING"]);
    expect(statusesThatCanBecome("RETRYING")).toEqual(["PENDING", "RETRYING"]);
    expect(statusesThatCanBecome("SENT")).toEqual(["PENDING", "RETRYING"]);
    expect(statusesThatCanBecome("SKIPPED")).toEqual(["PENDING", "RETRYING"]);
  });
});

describe("applyProviderMessage", () => {
  it("matches a 09… number to the stored +639… recipient and saves the provider reference", async () => {
    const store = storeWith("PENDING");

    await expect(applyProviderMessage(message(), store)).resolves.toBe("updated");

    expect(store.getRecipientStatus).toHaveBeenCalledWith("b1", "+639171234567");
    expect(store.updateRecipients).toHaveBeenCalledWith("b1", [
      { phone: "+639171234567", status: "SENT", failReason: null, providerRef: "msg_1" },
    ]);
  });

  it("saves the fail reason of a failed message", async () => {
    const store = storeWith("RETRYING");
    await applyProviderMessage(message({ status: "failed", failReason: "Network timeout" }), store);
    expect(store.updateRecipients.mock.calls[0][1][0]).toMatchObject({ status: "FAILED", failReason: "Network timeout" });
  });

  it.each([
    ["metadata without broadcastId", message({ metadata: { campaign: "x" } })],
    ["no metadata", message({ metadata: null })],
    ["a non-string broadcastId", message({ metadata: { broadcastId: 42 } })],
    ["an invalid number", message({ recipient: "12345" })],
  ])("ignores %s without touching the store", async (_case, msg) => {
    const store = storeWith("PENDING");
    await expect(applyProviderMessage(msg, store)).resolves.toBe("ignored");
    expect(store.getRecipientStatus).not.toHaveBeenCalled();
    expect(store.updateRecipients).not.toHaveBeenCalled();
  });

  it("ignores an unknown recipient", async () => {
    const store = storeWith(null);
    await expect(applyProviderMessage(message(), store)).resolves.toBe("ignored");
    expect(store.updateRecipients).not.toHaveBeenCalled();
  });

  it("ignores a late report that wouldn't change the status, keeping the stored fail reason", async () => {
    const store = storeWith("FAILED");
    await expect(applyProviderMessage(message({ status: "retrying" }), store)).resolves.toBe("ignored");
    expect(store.updateRecipients).not.toHaveBeenCalled();
  });
});

describe("createBufferedDeliveryStore", () => {
  const recipients = [
    { phone: "+639171234567", status: "PENDING" as const },
    { phone: "+639181234567", status: "SENT" as const },
  ];

  it("reads statuses from memory, only for its own broadcast", async () => {
    const { store } = createBufferedDeliveryStore("b1", recipients);
    await expect(store.getRecipientStatus("b1", "+639181234567")).resolves.toBe("SENT");
    await expect(store.getRecipientStatus("b1", "+639191234567")).resolves.toBeNull();
    await expect(store.getRecipientStatus("b2", "+639171234567")).resolves.toBeNull();
  });

  it("collects updates and reads them back, so a repeated report sees the new status", async () => {
    const { store, updates } = createBufferedDeliveryStore("b1", recipients);

    await expect(applyProviderMessage(message({ status: "retrying" }), store)).resolves.toBe("updated");
    await expect(applyProviderMessage(message({ status: "retrying" }), store)).resolves.toBe("ignored");
    await expect(applyProviderMessage(message({ status: "sent" }), store)).resolves.toBe("updated");

    expect(updates.map((update) => update.status)).toEqual(["RETRYING", "SENT"]);
    await expect(store.getRecipientStatus("b1", "+639171234567")).resolves.toBe("SENT");
  });
});
