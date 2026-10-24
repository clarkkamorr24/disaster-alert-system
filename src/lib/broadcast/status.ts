import { RecipientStatus } from "@/generated/prisma/enums";
import type { StatusTone } from "@/lib/domain/status-tone";
import type { BroadcastStatus } from "@/types/broadcast";

/** What each derived broadcast status is called in the UI. */
export const BROADCAST_STATUS_LABELS: Record<BroadcastStatus, string> = {
  SENDING: "Sending",
  COMPLETED: "Completed",
  PARTIAL: "Partially delivered",
  FAILED: "Failed",
};

/** The color each derived broadcast status is shown in, next to its label. */
export const BROADCAST_STATUS_TONES: Record<BroadcastStatus, StatusTone> = {
  SENDING: "moderate",
  COMPLETED: "clear",
  PARTIAL: "moderate",
  FAILED: "critical",
};

/** How each recipient status is shown: its label and the color next to it. */
export const RECIPIENT_STATUS_DISPLAY: Record<RecipientStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Pending", tone: "neutral" },
  RETRYING: { label: "Retrying", tone: "moderate" },
  SENT: { label: "Sent", tone: "clear" },
  FAILED: { label: "Failed", tone: "critical" },
  SKIPPED: { label: "Skipped", tone: "high" },
};

/** Recipients grouped the way delivery bars and tiles show them. */
export interface DeliveryBreakdown {
  sent: number;
  /** Pending + retrying. */
  pending: number;
  /** Failed + skipped. */
  notReached: number;
}

/**
 * Groups recipient counts into sent, still pending (pending + retrying), and
 * not reached (failed + skipped).
 *
 * @param counts - The number of recipients in each status.
 * @returns The three groups.
 */
export function deliveryBreakdown(counts: Record<RecipientStatus, number>): DeliveryBreakdown {
  return {
    sent: counts.SENT,
    pending: counts.PENDING + counts.RETRYING,
    notReached: counts.FAILED + counts.SKIPPED,
  };
}

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

/**
 * Works out what share of recipients were sent to.
 *
 * @param counts - The number of recipients in each status, across one or more broadcasts.
 * @returns `SENT` ÷ all recipients (0–1), or `null` when there are no recipients.
 */
export function deliveryRate(counts: Record<RecipientStatus, number>): number | null {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return total === 0 ? null : counts.SENT / total;
}

/**
 * Formats a {@link deliveryRate} as a percentage with one decimal.
 *
 * @param rate - A share from 0 to 1, or `null`.
 * @returns Text such as `96.4%` or `0%`, or `—` for `null`.
 */
export function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${Number((rate * 100).toFixed(1))}%`;
}
