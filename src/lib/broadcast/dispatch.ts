import "server-only";

import {
  findUnfilledPlaceholders,
  NO_MEMBERS_MESSAGE,
  NO_UNREACHED_MESSAGE,
  NOT_ENOUGH_CREDITS_MESSAGE,
  unfilledPlaceholderMessage,
} from "@/lib/broadcast/compose";
import { createPrismaBroadcastStore } from "@/lib/broadcast/prisma-store";
import { sendBroadcast } from "@/lib/broadcast/send";
import { findUnreachedMembers } from "@/lib/broadcast/unreached";
import { prisma } from "@/lib/db";
import { sanitizeSmsText, validateSmsContent, withPrefix } from "@/lib/domain/sms-text";
import { DEFAULT_SENDER_ID, getEnv } from "@/lib/env";
import { getSmsGateway } from "@/lib/sms";
import type { BroadcastInput, ResendInput } from "@/lib/validation/broadcast";
import type { ActionResult } from "@/types/action-result";
import type { Recipient } from "@/types/broadcast";

/** A message ready to send, or why it can't be. */
export type PreparedContent = { ok: true; content: string; credits: number } | { ok: false; error: string };

/** Who a broadcast goes to, and what it is linked to. */
export type Audience =
  | { ok: true; recipients: Recipient[]; alertId: string | null; retryOfId: string | null }
  | { ok: false; error: string };

/** A validated send: its key, the message as typed, and how to load its recipients. */
export type SendRequest = { idempotencyKey: string; content: string; loadAudience: () => Promise<Audience> };

/**
 * Cleans up a message, adds the SMS prefix, and checks it against the SMS
 * rules: not empty, no placeholders left, no unsupported characters, within
 * the length limit, and no links while the sender ID is the default.
 *
 * @param raw - The message as typed, without the prefix.
 * @returns The final text and its credits per recipient, or the problems as one sentence.
 */
export function prepareContent(raw: string): PreparedContent {
  const { SMS_MESSAGE_PREFIX, UNISMS_SENDER_ID } = getEnv();
  const body = sanitizeSmsText(raw);
  if (body === "") return { ok: false, error: "Message is empty." };

  const unfilled = findUnfilledPlaceholders(body);
  if (unfilled.length > 0) return { ok: false, error: unfilledPlaceholderMessage(unfilled) };

  const result = validateSmsContent(withPrefix(body, SMS_MESSAGE_PREFIX), {
    blockLinks: UNISMS_SENDER_ID === DEFAULT_SENDER_ID,
  });
  if (!result.ok) return { ok: false, error: result.errors.join(" ") };
  return result;
}

/**
 * Turns a member into a broadcast recipient, with the phone and name as they are now.
 *
 * @param member - The member's id, names, and canonical phone.
 * @returns The recipient snapshot.
 */
export function toRecipient(member: { id: string; firstName: string; lastName: string; phone: string }): Recipient {
  return { memberId: member.id, phone: member.phone, name: `${member.firstName} ${member.lastName}` };
}

/**
 * Loads the active members of the given zones, sorted by name.
 *
 * @param zoneIds - The zones to send to.
 * @returns Their active members as recipients.
 */
export async function loadZoneRecipients(zoneIds: string[]): Promise<Recipient[]> {
  const members = await prisma.member.findMany({
    where: { isActive: true, zoneId: { in: zoneIds } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, phone: true },
  });
  return members.map(toRecipient);
}

/**
 * The active members of the given zones, linked to the alert when there is one.
 *
 * @param input - A parsed send to zones.
 * @returns The audience, or an error when the alert was deleted or nobody is active there.
 */
export async function zoneAudience({ alertId, zoneIds }: BroadcastInput): Promise<Audience> {
  const [recipients, alert] = await Promise.all([
    loadZoneRecipients(zoneIds),
    alertId ? prisma.hazardAlert.findUnique({ where: { id: alertId }, select: { id: true } }) : null,
  ]);
  if (alertId && !alert) return { ok: false, error: "This alert was deleted. Reload the page." };
  if (recipients.length === 0) return { ok: false, error: NO_MEMBERS_MESSAGE };
  return { ok: true, recipients, alertId, retryOfId: null };
}

/**
 * The still-active members the original broadcast didn't reach, linked to it and to its alert.
 *
 * @param input - A parsed resend.
 * @returns The audience, or an error when the original was deleted or nobody is left.
 */
export async function resendAudience({ retryOfId }: ResendInput): Promise<Audience> {
  const [original, members] = await Promise.all([
    prisma.broadcast.findUnique({ where: { id: retryOfId }, select: { alertId: true } }),
    findUnreachedMembers(retryOfId),
  ]);
  if (!original) return { ok: false, error: "The original broadcast was deleted. Reload the page." };
  if (members.length === 0) return { ok: false, error: NO_UNREACHED_MESSAGE };
  return { ok: true, recipients: members.map(toRecipient), alertId: original.alertId, retryOfId };
}

/**
 * Checks a send, then creates and sends the broadcast. A key that was
 * already used returns its broadcast without checking or sending anything.
 *
 * @param request - The key, the message as typed, and the audience loader.
 * @returns The broadcast's id, or a user-facing error.
 */
export async function checkAndSend(request: SendRequest): Promise<ActionResult<{ broadcastId: string }>> {
  const { idempotencyKey } = request;
  const store = createPrismaBroadcastStore();
  const gateway = getSmsGateway();

  // Checked first, so a retry after a slow send opens the report instead of failing the checks below.
  const existingId = await store.findIdByIdempotencyKey(idempotencyKey);
  if (existingId) return { success: true, data: { broadcastId: existingId } };

  const content = prepareContent(request.content);
  if (!content.ok) return { success: false, error: content.error };

  const [audience, balance] = await Promise.all([request.loadAudience(), gateway.getCreditBalance()]);
  if (!audience.ok) return { success: false, error: audience.error };
  const { recipients, alertId, retryOfId } = audience;
  if (balance !== null && content.credits * recipients.length > balance) {
    return { success: false, error: NOT_ENOUGH_CREDITS_MESSAGE };
  }

  const { broadcastId } = await sendBroadcast(
    { idempotencyKey, content: content.content, alertId, retryOfId, recipients },
    { gateway, store, senderId: getEnv().UNISMS_SENDER_ID },
  );
  return { success: true, data: { broadcastId } };
}
