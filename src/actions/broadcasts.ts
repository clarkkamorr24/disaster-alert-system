"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOfficer } from "@/lib/auth/dal";
import {
  findUnfilledPlaceholders,
  NO_MEMBERS_MESSAGE,
  NO_UNREACHED_MESSAGE,
  NOT_ENOUGH_CREDITS_MESSAGE,
  unfilledPlaceholderMessage,
} from "@/lib/broadcast/compose";
import { applyProviderMessage, createBufferedDeliveryStore } from "@/lib/broadcast/delivery";
import { createPrismaBroadcastStore } from "@/lib/broadcast/prisma-store";
import { sendBroadcast } from "@/lib/broadcast/send";
import { findUnreachedMembers } from "@/lib/broadcast/unreached";
import { prisma } from "@/lib/db";
import { sanitizeSmsText, validateSmsContent, withPrefix } from "@/lib/domain/sms-text";
import { DEFAULT_SENDER_ID, getEnv } from "@/lib/env";
import { getSmsGateway } from "@/lib/sms";
import {
  type BroadcastInput,
  broadcastInputSchema,
  type ResendInput,
  resendInputSchema,
} from "@/lib/validation/broadcast";
import type { ActionResult } from "@/types/action-result";
import type { Recipient, SendBroadcastActionInput } from "@/types/broadcast";
import { type ProviderMessage, SmsGatewayError } from "@/types/sms";

type PreparedContent = { ok: true; content: string; credits: number } | { ok: false; error: string };

/** Who a broadcast goes to, and what it is linked to. */
type Audience =
  | { ok: true; recipients: Recipient[]; alertId: string | null; retryOfId: string | null }
  | { ok: false; error: string };

/** A validated send: its key, the message as typed, and how to load its recipients. */
type SendRequest = { idempotencyKey: string; content: string; loadAudience: () => Promise<Audience> };

/** Adds the prefix and checks the message against the SMS rules. */
function prepareContent(raw: string): PreparedContent {
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

function toRecipient(member: { id: string; firstName: string; lastName: string; phone: string }): Recipient {
  return { memberId: member.id, phone: member.phone, name: `${member.firstName} ${member.lastName}` };
}

/** The active members of the given zones, linked to the alert when there is one. */
async function zoneAudience({ alertId, zoneIds }: BroadcastInput): Promise<Audience> {
  const [members, alert] = await Promise.all([
    prisma.member.findMany({
      where: { isActive: true, zoneId: { in: zoneIds } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, phone: true },
    }),
    alertId ? prisma.hazardAlert.findUnique({ where: { id: alertId }, select: { id: true } }) : null,
  ]);
  if (alertId && !alert) return { ok: false, error: "This alert was deleted. Reload the page." };
  if (members.length === 0) return { ok: false, error: NO_MEMBERS_MESSAGE };
  return { ok: true, recipients: members.map(toRecipient), alertId, retryOfId: null };
}

/** The still-active members the original broadcast didn't reach, linked to it and to its alert. */
async function resendAudience({ retryOfId }: ResendInput): Promise<Audience> {
  const [original, members] = await Promise.all([
    prisma.broadcast.findUnique({ where: { id: retryOfId }, select: { alertId: true } }),
    findUnreachedMembers(retryOfId),
  ]);
  if (!original) return { ok: false, error: "The original broadcast was deleted. Reload the page." };
  if (members.length === 0) return { ok: false, error: NO_UNREACHED_MESSAGE };
  return { ok: true, recipients: members.map(toRecipient), alertId: original.alertId, retryOfId };
}

/** Validates the compose form's input as a resend (with `retryOfId`) or a send to zones. */
function parseSendInput(
  input: SendBroadcastActionInput,
): { ok: true; request: SendRequest } | { ok: false; error: string } {
  if (typeof input === "object" && input !== null && "retryOfId" in input) {
    const parsed = resendInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    return { ok: true, request: { ...parsed.data, loadAudience: () => resendAudience(parsed.data) } };
  }
  const parsed = broadcastInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return { ok: true, request: { ...parsed.data, loadAudience: () => zoneAudience(parsed.data) } };
}

/** Checks the send, then creates and sends the broadcast. Returns the broadcast's id. */
async function checkAndSend(request: SendRequest): Promise<ActionResult<{ broadcastId: string }>> {
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

/**
 * Sends a broadcast from the compose form, then redirects to its report. It
 * goes to the active members of the chosen zones or, with `retryOfId`, to the
 * still-active members the original broadcast didn't reach. A repeat with the
 * same idempotency key opens the existing report and sends nothing.
 */
export async function sendBroadcastAction(
  input: SendBroadcastActionInput,
): Promise<ActionResult<{ broadcastId: string }>> {
  await requireOfficer();

  const parsed = parseSendInput(input);
  if (!parsed.ok) return { success: false, error: parsed.error };

  let result: ActionResult<{ broadcastId: string }>;
  try {
    result = await checkAndSend(parsed.request);
  } catch (error) {
    console.error("sendBroadcastAction failed", error);
    return {
      success: false,
      error: "Something went wrong while sending. Press Send again: no member gets the message twice.",
    };
  }
  if (!result.success) return result;

  revalidatePath("/broadcasts", "layout");
  redirect(`/broadcasts/${result.data.broadcastId}`);
}

/**
 * Pulls every message of a broadcast's blasts from the SMS provider and
 * applies the statuses, for when webhooks aren't set up or were missed.
 * Statuses never move backwards. Returns how many recipients changed.
 */
export async function refreshBroadcastStatus(id: string): Promise<ActionResult<{ updated: number }>> {
  await requireOfficer();

  try {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
      select: { blastIds: true, recipients: { select: { phone: true, status: true } } },
    });
    if (!broadcast) return { success: false, error: "This broadcast no longer exists." };

    // Every blast is fetched before anything is applied, so a failed lookup changes nothing.
    const gateway = getSmsGateway();
    const messages: ProviderMessage[] = [];
    for (const blastId of broadcast.blastIds) messages.push(...(await gateway.getBlastMessages(blastId)));

    const buffer = createBufferedDeliveryStore(id, broadcast.recipients);
    let updated = 0;
    for (const message of messages) {
      if ((await applyProviderMessage(message, buffer.store)) === "updated") updated += 1;
    }
    await createPrismaBroadcastStore().updateRecipients(id, buffer.updates);

    revalidatePath("/broadcasts", "layout");
    return { success: true, data: { updated } };
  } catch (error) {
    if (error instanceof SmsGatewayError) return { success: false, error: "Couldn't reach UniSMS. Try again." };
    console.error("refreshBroadcastStatus failed", error);
    return { success: false, error: "Couldn't refresh the status. Try again." };
  }
}
