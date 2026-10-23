import { RecipientStatus } from "@/generated/prisma/enums";
import type { BroadcastStatus } from "@/types/broadcast";

/** What each derived broadcast status is called in the UI. */
export const BROADCAST_STATUS_LABELS: Record<BroadcastStatus, string> = {
  SENDING: "Sending",
  COMPLETED: "Completed",
  PARTIAL: "Partially delivered",
  FAILED: "Failed",
};

/**
 * Creates a count of zero for every recipient status, to add up recipients into.
 *
 * @returns A fresh record with every status at 0.
 */
export function emptyStatusCounts(): Record<RecipientStatus, number> {
  return Object.fromEntries(Object.values(RecipientStatus).map((status) => [status, 0])) as Record<
    RecipientStatus,
    number
  >;
}

/**
 * Derives a broadcast's overall status from its recipients' statuses. The
 * status isn't stored, so it can't drift when reports arrive late or out of
 * order.
 *
 * @param counts - The number of recipients in each status.
 * @returns `SENDING` while any message is pending or retrying, `COMPLETED` when
 *   every recipient was sent to, `PARTIAL` when some were, otherwise `FAILED`.
 */
export function deriveBroadcastStatus(counts: Record<RecipientStatus, number>): BroadcastStatus {
  if (counts.PENDING > 0 || counts.RETRYING > 0) return "SENDING";
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (counts.SENT > 0 && counts.SENT === total) return "COMPLETED";
  if (counts.SENT > 0) return "PARTIAL";
  return "FAILED";
}
