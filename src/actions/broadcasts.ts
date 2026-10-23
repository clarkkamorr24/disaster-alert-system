"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOfficer } from "@/lib/auth/dal";
import { applyProviderMessage, createBufferedDeliveryStore } from "@/lib/broadcast/delivery";
import { checkAndSend, resendAudience, type SendRequest, zoneAudience } from "@/lib/broadcast/dispatch";
import { createPrismaBroadcastStore } from "@/lib/broadcast/prisma-store";
import { prisma } from "@/lib/db";
import { getSmsGateway } from "@/lib/sms";
import { broadcastInputSchema, resendInputSchema } from "@/lib/validation/broadcast";
import type { ActionResult } from "@/types/action-result";
import type { SendBroadcastActionInput } from "@/types/broadcast";
import { type ProviderMessage, SmsGatewayError } from "@/types/sms";

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
