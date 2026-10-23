import { toCanonicalPhone } from "@/lib/domain/phone";
import { estimateCredits } from "@/lib/domain/sms-text";
import type { BroadcastStore, Recipient, RecipientUpdate, SendBroadcastInput } from "@/types/broadcast";
import type { BlastResult, SmsGateway } from "@/types/sms";

/** Most recipients sent in one UniSMS `/blast` call. */
export const BLAST_CHUNK_SIZE = 500;

/** Wait between `/blast` calls; UniSMS allows one every 2 seconds. */
export const BLAST_SPACING_MS = 2000;

/** Fail reason for a chunk still rate-limited after one retry. */
export const GATEWAY_BUSY_REASON = "SMS gateway busy, try resending";

/** Dependencies of {@link sendBroadcast}, injected so it can be tested without a network or database. */
export interface SendBroadcastDeps {
  gateway: SmsGateway;
  store: BroadcastStore;
  senderId: string;
  /** Defaults to a `setTimeout` promise. */
  sleep?: (ms: number) => Promise<void>;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Splits a list into consecutive pieces of at most `size` items.
 *
 * @param items - The list to split.
 * @param size - Largest piece; must be at least 1.
 * @returns The pieces in order; empty for an empty list.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const pieces: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    pieces.push(items.slice(start, start + size));
  }
  return pieces;
}

/** Calls the gateway, turning a thrown error into a network error so one chunk can't stop the rest. */
async function blastOnce(
  gateway: SmsGateway,
  request: Parameters<SmsGateway["blast"]>[0],
): Promise<BlastResult> {
  try {
    return await gateway.blast(request);
  } catch (error) {
    return { kind: "network_error", message: error instanceof Error ? error.message : String(error) };
  }
}

function failAll(recipients: Recipient[], failReason: string): RecipientUpdate[] {
  return recipients.map(({ phone }) => ({ phone, status: "FAILED", failReason }));
}

/** Sends one chunk, retrying once on a rate limit, and records the outcome. */
async function sendChunk(
  broadcastId: string,
  content: string,
  recipients: Recipient[],
  deps: SendBroadcastDeps & { sleep: (ms: number) => Promise<void> },
): Promise<void> {
  const request = {
    recipients: recipients.map((recipient) => recipient.phone),
    content,
    senderId: deps.senderId,
    metadata: { broadcastId },
  };

  let result = await blastOnce(deps.gateway, request);
  if (result.kind === "rate_limited") {
    await deps.sleep(result.retryAfterMs);
    result = await blastOnce(deps.gateway, request);
  }

  switch (result.kind) {
    case "ok": {
      await deps.store.addBlastId(broadcastId, result.blastId);
      // Queued numbers stay PENDING until a delivery report arrives.
      const skipped: RecipientUpdate[] = result.skipped.map(({ recipient, reason }) => ({
        phone: toCanonicalPhone(recipient),
        status: "SKIPPED",
        failReason: reason,
      }));
      if (skipped.length > 0) await deps.store.updateRecipients(broadcastId, skipped);
      return;
    }
    case "rate_limited":
      return deps.store.updateRecipients(broadcastId, failAll(recipients, GATEWAY_BUSY_REASON));
    case "rejected":
      return deps.store.updateRecipients(
        broadcastId,
        failAll(recipients, `SMS gateway rejected the request: ${result.message}`),
      );
    case "network_error":
      return deps.store.updateRecipients(
        broadcastId,
        failAll(recipients, `Could not reach SMS gateway: ${result.message}`),
      );
  }
}

/**
 * Creates a broadcast and sends it in chunks of {@link BLAST_CHUNK_SIZE},
 * {@link BLAST_SPACING_MS} apart.
 *
 * Sending is idempotent on `idempotencyKey`: when a broadcast with that key
 * already exists, including one created by a concurrent submit, nothing is
 * sent and its id is returned with `duplicate: true`.
 *
 * Each chunk's outcome is recorded on its recipients: queued numbers stay
 * `PENDING`, numbers the gateway skipped become `SKIPPED` with its reason, and
 * a rejected request, a network error, or a second rate limit marks the whole
 * chunk `FAILED`. A failed chunk never stops the chunks after it, even when
 * its result can't be saved (it is logged instead).
 *
 * @param input - The broadcast and its recipients; `content` is the final text.
 * @param deps - Gateway, store, sender ID, and an optional `sleep`.
 * @returns The broadcast's id, and whether it already existed.
 */
export async function sendBroadcast(
  input: SendBroadcastInput,
  deps: SendBroadcastDeps,
): Promise<{ broadcastId: string; duplicate: boolean }> {
  const { store } = deps;
  const sleep = deps.sleep ?? defaultSleep;

  const existingId = await store.findIdByIdempotencyKey(input.idempotencyKey);
  if (existingId) return { broadcastId: existingId, duplicate: true };

  const { id: broadcastId, created } = await store.create({
    ...input,
    senderId: deps.senderId,
    creditsPerRecipient: estimateCredits(input.content),
  });
  if (!created) return { broadcastId, duplicate: true };

  const chunks = chunk(input.recipients, BLAST_CHUNK_SIZE);
  for (const [index, recipients] of chunks.entries()) {
    if (index > 0) await sleep(BLAST_SPACING_MS);
    try {
      await sendChunk(broadcastId, input.content, recipients, { ...deps, sleep });
    } catch (error) {
      // Saving this chunk's result failed. Keep going, so the later chunks' members are still warned.
      console.error(`sendBroadcast: couldn't record chunk ${index + 1} of broadcast ${broadcastId}`, error);
    }
  }

  return { broadcastId, duplicate: false };
}
