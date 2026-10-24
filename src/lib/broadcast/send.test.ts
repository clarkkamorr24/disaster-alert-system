import { beforeEach, describe, expect, it, vi } from "vitest";

import { BLAST_CHUNK_SIZE, chunk, GATEWAY_BUSY_REASON, sendBroadcast } from "@/lib/broadcast/send";
import type { RecipientStatus } from "@/generated/prisma/enums";
import type { BroadcastStore, Recipient, SendBroadcastInput } from "@/types/broadcast";
import type { BlastResult, SmsGateway } from "@/types/sms";

interface StoredRecipient {
  status: RecipientStatus;
  failReason: string | null;
}

/** A BroadcastStore that keeps everything in memory and matches phones exactly. */
function createMemoryStore() {
  const keys = new Map<string, string>();
  const blastIds = new Map<string, string[]>();
  const recipients = new Map<string, Map<string, StoredRecipient>>();
  let nextId = 1;

  const store = {
    findIdByIdempotencyKey: vi.fn(async (key: string) => keys.get(key) ?? null),
    create: vi.fn(async (input: Parameters<BroadcastStore["create"]>[0]) => {
      const id = `b${nextId++}`;
      keys.set(input.idempotencyKey, id);
      blastIds.set(id, []);
      recipients.set(
        id,
        new Map(input.recipients.map((r) => [r.phone, { status: "PENDING", failReason: null }])),
      );
      return { id, created: true };
    }),
    addBlastId: vi.fn(async (broadcastId: string, blastId: string) => {
      blastIds.get(broadcastId)?.push(blastId);
    }),
    updateRecipients: vi.fn<BroadcastStore["updateRecipients"]>(async (broadcastId, updates) => {
      for (const update of updates) {
        const recipient = recipients.get(broadcastId)?.get(update.phone);
        if (!recipient) continue;
        recipient.status = update.status;
        if (update.failReason !== undefined) recipient.failReason = update.failReason;
      }
    }),
  } satisfies BroadcastStore;

  return {
    store,
    blastIds: (id: string) => blastIds.get(id) ?? [],
    recipient: (id: string, phone: string) => recipients.get(id)?.get(phone),
  };
}

/** A gateway whose blast results are scripted in call order; unscripted calls succeed. */
function createScriptedGateway(script: BlastResult[] = []) {
  let call = 0;
  const blast = vi.fn<SmsGateway["blast"]>(async () => {
    call += 1;
    return script[call - 1] ?? { kind: "ok", blastId: `blast-${call}`, queued: 0, skipped: [] };
  });
  const gateway: SmsGateway = {
    blast,
    getBlastMessages: vi.fn(async () => []),
    getCreditBalance: vi.fn(async () => 1000),
  };
  return { gateway, blast };
}

function makeRecipients(count: number): Recipient[] {
  return Array.from({ length: count }, (_, i) => ({
    memberId: `m${i}`,
    phone: `+63917${String(i).padStart(7, "0")}`,
    name: `Member ${i}`,
  }));
}

function makeInput(recipients: Recipient[]): SendBroadcastInput {
  return {
    idempotencyKey: "4f9c2a7e-1b3d-4c5e-8f60-123456789abc",
    content: "Mi-isi FA: Lahar warning",
    alertId: null,
    retryOfId: null,
    templateId: null,
    recipients,
  };
}

describe("chunk", () => {
  it("splits into pieces of at most the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns no pieces for an empty list", () => {
    expect(chunk([], 500)).toEqual([]);
  });
});

describe("sendBroadcast", () => {
  let sleep: ReturnType<typeof vi.fn<(ms: number) => Promise<void>>>;

  beforeEach(() => {
    sleep = vi.fn(async () => {});
  });

  it("sends once when called twice with the same idempotency key", async () => {
    const { store } = createMemoryStore();
    const { gateway, blast } = createScriptedGateway();
    const input = makeInput(makeRecipients(3));
    const deps = { gateway, store, senderId: "Unisoft", sleep };

    const a = await sendBroadcast(input, deps);
    const b = await sendBroadcast(input, deps);

    expect(a.duplicate).toBe(false);
    expect(b).toEqual({ broadcastId: a.broadcastId, duplicate: true });
    expect(blast).toHaveBeenCalledTimes(1);
    expect(store.create).toHaveBeenCalledTimes(1);
  });

  it("sends nothing when a concurrent submit created the broadcast first", async () => {
    const { store } = createMemoryStore();
    store.create.mockResolvedValueOnce({ id: "existing", created: false });
    const { gateway, blast } = createScriptedGateway();

    const result = await sendBroadcast(makeInput(makeRecipients(3)), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(result).toEqual({ broadcastId: "existing", duplicate: true });
    expect(blast).not.toHaveBeenCalled();
  });

  it("creates the broadcast with the sender ID and credits per recipient", async () => {
    const { store } = createMemoryStore();
    const { gateway } = createScriptedGateway();
    const input = makeInput(makeRecipients(1));

    await sendBroadcast(input, { gateway, store, senderId: "MiisiFA", sleep });

    expect(store.create).toHaveBeenCalledWith({ ...input, senderId: "MiisiFA", creditsPerRecipient: 1 });
  });

  it("sends 1,200 recipients as 500/500/200, 2 seconds apart", async () => {
    const { store, blastIds } = createMemoryStore();
    const { gateway, blast } = createScriptedGateway();

    const { broadcastId } = await sendBroadcast(makeInput(makeRecipients(1200)), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(blast.mock.calls.map(([req]) => req.recipients.length)).toEqual([500, 500, 200]);
    expect(sleep.mock.calls).toEqual([[2000], [2000]]);
    expect(BLAST_CHUNK_SIZE).toBe(500);
    expect(blastIds(broadcastId)).toEqual(["blast-1", "blast-2", "blast-3"]);
  });

  it("marks skipped numbers SKIPPED with the reason, matching the normalized phone", async () => {
    const { store, blastIds, recipient } = createMemoryStore();
    const { gateway } = createScriptedGateway([
      { kind: "ok", blastId: "blast-a", queued: 1, skipped: [{ recipient: "09171234567", reason: "x" }] },
    ]);
    const recipients: Recipient[] = [
      { memberId: "m1", phone: "+639171234567", name: "Ana Cruz" },
      { memberId: "m2", phone: "+639181234567", name: "Ben Reyes" },
    ];

    const { broadcastId } = await sendBroadcast(makeInput(recipients), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(recipient(broadcastId, "+639171234567")).toEqual({ status: "SKIPPED", failReason: "x" });
    expect(recipient(broadcastId, "+639181234567")).toEqual({ status: "PENDING", failReason: null });
    expect(blastIds(broadcastId)).toEqual(["blast-a"]);
  });

  it("fails only the chunk with a network error and still sends the next chunk", async () => {
    const { store, recipient } = createMemoryStore();
    const { gateway, blast } = createScriptedGateway([
      { kind: "ok", blastId: "blast-1", queued: 500, skipped: [] },
      { kind: "network_error", message: "timeout" },
    ]);
    const recipients = makeRecipients(1200);

    const { broadcastId } = await sendBroadcast(makeInput(recipients), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(blast).toHaveBeenCalledTimes(3);
    const statuses = recipients.map((r) => recipient(broadcastId, r.phone));
    expect(statuses.slice(0, 500).every((s) => s?.status === "PENDING")).toBe(true);
    expect(
      statuses
        .slice(500, 1000)
        .every((s) => s?.status === "FAILED" && s.failReason === "Could not reach SMS gateway: timeout"),
    ).toBe(true);
    expect(statuses.slice(1000).every((s) => s?.status === "PENDING")).toBe(true);
  });

  it("keeps sending the next chunks when saving a chunk's result fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { store, blastIds } = createMemoryStore();
    store.addBlastId.mockRejectedValueOnce(new Error("database unavailable"));
    const { gateway, blast } = createScriptedGateway();

    const result = await sendBroadcast(makeInput(makeRecipients(1200)), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(result.duplicate).toBe(false);
    expect(blast).toHaveBeenCalledTimes(3);
    expect(blastIds(result.broadcastId)).toEqual(["blast-2", "blast-3"]);
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it("treats a thrown gateway error as a network error", async () => {
    const { store, recipient } = createMemoryStore();
    const { gateway, blast } = createScriptedGateway();
    blast.mockRejectedValueOnce(new Error("socket hang up"));

    const { broadcastId } = await sendBroadcast(makeInput(makeRecipients(1)), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(recipient(broadcastId, makeRecipients(1)[0].phone)).toEqual({
      status: "FAILED",
      failReason: "Could not reach SMS gateway: socket hang up",
    });
  });

  it("fails the chunk with the gateway's message when the request is rejected", async () => {
    const { store, recipient } = createMemoryStore();
    const { gateway } = createScriptedGateway([{ kind: "rejected", status: 422, message: "Bad sender" }]);
    const [only] = makeRecipients(1);

    const { broadcastId } = await sendBroadcast(makeInput([only]), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(recipient(broadcastId, only.phone)).toEqual({
      status: "FAILED",
      failReason: "SMS gateway rejected the request: Bad sender",
    });
  });

  it("waits retryAfterMs and retries once after a rate limit", async () => {
    const { store, blastIds } = createMemoryStore();
    const { gateway, blast } = createScriptedGateway([{ kind: "rate_limited", retryAfterMs: 1500 }]);

    const { broadcastId } = await sendBroadcast(makeInput(makeRecipients(2)), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(sleep.mock.calls).toEqual([[1500]]);
    expect(blast).toHaveBeenCalledTimes(2);
    expect(blastIds(broadcastId)).toEqual(["blast-2"]);
  });

  it("fails the chunk when it is rate-limited twice", async () => {
    const { store, recipient } = createMemoryStore();
    const { gateway, blast } = createScriptedGateway([
      { kind: "rate_limited", retryAfterMs: 1500 },
      { kind: "rate_limited", retryAfterMs: 1500 },
    ]);
    const [only] = makeRecipients(1);

    const { broadcastId } = await sendBroadcast(makeInput([only]), {
      gateway,
      store,
      senderId: "Unisoft",
      sleep,
    });

    expect(blast).toHaveBeenCalledTimes(2);
    expect(recipient(broadcastId, only.phone)).toEqual({ status: "FAILED", failReason: GATEWAY_BUSY_REASON });
    expect(GATEWAY_BUSY_REASON).toBe("SMS gateway busy, try resending");
  });

  it("sends the content, sender ID, and { broadcastId } metadata on every blast", async () => {
    const { store } = createMemoryStore();
    const { gateway, blast } = createScriptedGateway();
    const input = makeInput(makeRecipients(1200));

    const { broadcastId } = await sendBroadcast(input, { gateway, store, senderId: "Unisoft", sleep });

    for (const [req] of blast.mock.calls) {
      expect(req).toMatchObject({ content: input.content, senderId: "Unisoft", metadata: { broadcastId } });
    }
  });
});
