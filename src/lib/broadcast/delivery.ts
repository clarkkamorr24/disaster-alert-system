import { RecipientStatus } from "@/generated/prisma/enums";
import { normalizePhilippineMobile } from "@/lib/domain/phone";
import type { DeliveryStore, RecipientUpdate } from "@/types/broadcast";
import type { ProviderMessage, ProviderStatus } from "@/types/sms";

const FROM_PROVIDER: Record<ProviderStatus, RecipientStatus> = {
  pending: "PENDING",
  retrying: "RETRYING",
  sent: "SENT",
  failed: "FAILED",
};

const RANK: Record<RecipientStatus, number> = {
  PENDING: 0,
  RETRYING: 1,
  SENT: 2,
  FAILED: 2,
  SKIPPED: 2,
};

const FINAL: ReadonlySet<RecipientStatus> = new Set(["SENT", "FAILED", "SKIPPED"]);

/**
 * Decides a recipient's status after a delivery report, so a status never
 * moves backwards. `SENT`, `FAILED`, and `SKIPPED` are final; otherwise the
 * reported status is taken only if it ranks at least as high as the current
 * one (`PENDING` < `RETRYING` < `SENT` = `FAILED`).
 *
 * @param current - The stored status.
 * @param incoming - The status the provider reported.
 * @returns The status to store.
 *
 * @example
 * nextRecipientStatus("PENDING", "retrying"); // "RETRYING"
 * nextRecipientStatus("SENT", "retrying"); // "SENT"
 */
export function nextRecipientStatus(current: RecipientStatus, incoming: ProviderStatus): RecipientStatus {
  if (FINAL.has(current)) return current;
  const next = FROM_PROVIDER[incoming];
  return RANK[next] >= RANK[current] ? next : current;
}

/**
 * Lists the stored statuses a recipient may move from to reach `target`
 * without going backwards. Used as a database guard, so two reports that
 * race can't undo each other.
 *
 * @param target - The status about to be written.
 * @returns The non-final statuses ranked at or below `target`.
 *
 * @example
 * statusesThatCanBecome("SENT"); // ["PENDING", "RETRYING"]
 */
export function statusesThatCanBecome(target: RecipientStatus): RecipientStatus[] {
  return Object.values(RecipientStatus).filter((status) => !FINAL.has(status) && RANK[status] <= RANK[target]);
}

/**
 * Applies one delivery report to the recipient it belongs to. The recipient is
 * found by `metadata.broadcastId` plus the normalized phone, since the
 * provider may report `09…` while `+639…` is stored.
 *
 * @param msg - The message as the provider reported it (webhook or status lookup).
 * @param store - Where recipient statuses are read and written.
 * @returns `"updated"` when the status changed; `"ignored"` when the message has
 *   no broadcast id, an invalid number, no matching recipient, or no change.
 */
export async function applyProviderMessage(
  msg: ProviderMessage,
  store: DeliveryStore,
): Promise<"updated" | "ignored"> {
  const broadcastId = msg.metadata?.broadcastId;
  if (typeof broadcastId !== "string" || broadcastId === "") return "ignored";

  const normalized = normalizePhilippineMobile(msg.recipient);
  if (!normalized.ok) return "ignored";
  const phone = normalized.e164;

  const current = await store.getRecipientStatus(broadcastId, phone);
  if (current === null) return "ignored";

  // An unchanged status is skipped, so a late report can't clear a stored fail reason.
  const next = nextRecipientStatus(current, msg.status);
  if (next === current) return "ignored";

  await store.updateRecipients(broadcastId, [
    { phone, status: next, failReason: msg.failReason, providerRef: msg.referenceId },
  ]);
  return "updated";
}

/**
 * Creates a {@link DeliveryStore} over statuses already loaded for one
 * broadcast. Reads come from memory and writes are collected in `updates`, so
 * a status refresh costs one read and one write instead of two queries per
 * message.
 *
 * @param broadcastId - The broadcast the statuses belong to; other ids read as unknown.
 * @param recipients - Each recipient's canonical phone and stored status.
 * @returns The store and the updates it collected, to save in one go.
 */
export function createBufferedDeliveryStore(
  broadcastId: string,
  recipients: { phone: string; status: RecipientStatus }[],
): { store: DeliveryStore; updates: RecipientUpdate[] } {
  const statuses = new Map(recipients.map((recipient) => [recipient.phone, recipient.status]));
  const updates: RecipientUpdate[] = [];

  return {
    updates,
    store: {
      async getRecipientStatus(id, phone) {
        return id === broadcastId ? (statuses.get(phone) ?? null) : null;
      },
      async updateRecipients(id, batch) {
        if (id !== broadcastId) return;
        for (const update of batch) {
          statuses.set(update.phone, update.status);
          updates.push(update);
        }
      },
    },
  };
}
