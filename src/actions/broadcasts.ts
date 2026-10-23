"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOfficer } from "@/lib/auth/dal";
import {
  findUnfilledPlaceholders,
  NO_MEMBERS_MESSAGE,
  NOT_ENOUGH_CREDITS_MESSAGE,
  unfilledPlaceholderMessage,
} from "@/lib/broadcast/compose";
import { createPrismaBroadcastStore } from "@/lib/broadcast/prisma-store";
import { sendBroadcast } from "@/lib/broadcast/send";
import { prisma } from "@/lib/db";
import { sanitizeSmsText, validateSmsContent, withPrefix } from "@/lib/domain/sms-text";
import { DEFAULT_SENDER_ID, getEnv } from "@/lib/env";
import { getSmsGateway } from "@/lib/sms";
import { type BroadcastInput, broadcastInputSchema } from "@/lib/validation/broadcast";
import type { ActionResult } from "@/types/action-result";
import type { Recipient, SendBroadcastActionInput } from "@/types/broadcast";

type PreparedContent = { ok: true; content: string; credits: number } | { ok: false; error: string };

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

/** The active members in the given zones, as broadcast recipients. */
async function loadRecipients(zoneIds: string[]): Promise<Recipient[]> {
  const members = await prisma.member.findMany({
    where: { isActive: true, zoneId: { in: zoneIds } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, phone: true },
  });
  return members.map((member) => ({
    memberId: member.id,
    phone: member.phone,
    name: `${member.firstName} ${member.lastName}`,
  }));
}

/** Checks the send, then creates and sends the broadcast. Returns the broadcast's id. */
async function checkAndSend(
  input: BroadcastInput,
): Promise<ActionResult<{ broadcastId: string }>> {
  const { idempotencyKey, alertId, zoneIds } = input;
  const store = createPrismaBroadcastStore();
  const gateway = getSmsGateway();

  // Checked first, so a retry after a slow send opens the report instead of failing the checks below.
  const existingId = await store.findIdByIdempotencyKey(idempotencyKey);
  if (existingId) return { success: true, data: { broadcastId: existingId } };

  const content = prepareContent(input.content);
  if (!content.ok) return { success: false, error: content.error };

  const [recipients, alert, balance] = await Promise.all([
    loadRecipients(zoneIds),
    alertId ? prisma.hazardAlert.findUnique({ where: { id: alertId }, select: { id: true } }) : null,
    gateway.getCreditBalance(),
  ]);
  if (alertId && !alert) return { success: false, error: "This alert was deleted. Reload the page." };
  if (recipients.length === 0) return { success: false, error: NO_MEMBERS_MESSAGE };
  if (balance !== null && content.credits * recipients.length > balance) {
    return { success: false, error: NOT_ENOUGH_CREDITS_MESSAGE };
  }

  const { broadcastId } = await sendBroadcast(
    { idempotencyKey, content: content.content, alertId, retryOfId: null, recipients },
    { gateway, store, senderId: getEnv().UNISMS_SENDER_ID },
  );
  return { success: true, data: { broadcastId } };
}

/**
 * Sends a broadcast from the compose form to the active members of the chosen
 * zones, then redirects to its report. A repeat with the same idempotency key
 * opens the existing report and sends nothing.
 */
export async function sendBroadcastAction(
  input: SendBroadcastActionInput,
): Promise<ActionResult<{ broadcastId: string }>> {
  await requireOfficer();

  const parsed = broadcastInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  let result: ActionResult<{ broadcastId: string }>;
  try {
    result = await checkAndSend(parsed.data);
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
