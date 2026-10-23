"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOfficer } from "@/lib/auth/dal";
import { NO_MEMBERS_MESSAGE, NOT_ENOUGH_CREDITS_MESSAGE } from "@/lib/broadcast/compose";
import { checkAndSend, loadZoneRecipients, prepareContent } from "@/lib/broadcast/dispatch";
import { createPrismaBroadcastStore } from "@/lib/broadcast/prisma-store";
import { prisma } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { getSmsGateway } from "@/lib/sms";
import { type AlertSendParsed, alertSendSchema } from "@/lib/validation/alert";
import type { ActionResult } from "@/types/action-result";
import type { AlertSendFailure, AlertSendInput } from "@/types/alert";
import type { Recipient } from "@/types/broadcast";

const LOG_FAILED_MESSAGE = "Couldn't log the alert. Reload the page and try again.";
const SEND_FAILED_MESSAGE = "Something went wrong while sending. Press Send again: no member gets the message twice.";

function revalidateAlertPages() {
  revalidatePath("/alerts", "layout");
  revalidatePath("/dashboard");
}

/** What the SMS checks found before anything is logged. */
type SendCheck =
  | { ok: true; existingBroadcastId: string | null; recipients: Recipient[] }
  | { ok: false; error: string };

/**
 * Checks the message, the zones' active members, and the credits, so a send
 * that can't go out logs nothing. A key whose broadcast already exists skips
 * the checks: that send already happened.
 */
async function checkSend({ idempotencyKey, content, zoneIds }: AlertSendParsed): Promise<SendCheck> {
  const existingBroadcastId = await createPrismaBroadcastStore().findIdByIdempotencyKey(idempotencyKey);
  if (existingBroadcastId) return { ok: true, existingBroadcastId, recipients: [] };

  const prepared = prepareContent(content);
  if (!prepared.ok) return prepared;

  const [recipients, balance] = await Promise.all([
    loadZoneRecipients(zoneIds),
    getSmsGateway().getCreditBalance(),
  ]);
  if (recipients.length === 0) return { ok: false, error: NO_MEMBERS_MESSAGE };
  if (balance !== null && prepared.credits * recipients.length > balance) {
    return { ok: false, error: NOT_ENOUGH_CREDITS_MESSAGE };
  }
  return { ok: true, existingBroadcastId: null, recipients };
}

/** Logs the alert, or returns the one this form's key already logged. */
async function findOrCreateAlert(form: AlertSendParsed): Promise<string> {
  const { idempotencyKey, title, hazardType, severity, officialLevel, description, zoneIds } = form;
  try {
    const alert = await prisma.hazardAlert.create({
      data: {
        idempotencyKey,
        title,
        hazardType,
        severity,
        officialLevel,
        description,
        zones: { connect: zoneIds.map((zoneId) => ({ id: zoneId })) },
      },
      select: { id: true },
    });
    return alert.id;
  } catch (error) {
    if (!isUniqueViolation(error, "idempotencyKey")) throw error;
    const existing = await prisma.hazardAlert.findUniqueOrThrow({ where: { idempotencyKey }, select: { id: true } });
    return existing.id;
  }
}

/**
 * Logs an alert from the New alert form and, when `send` is true, sends its
 * SMS to the active members of its zones, then opens the broadcast report
 * (or the alert, without an SMS). The form's key is used for both the alert
 * and the broadcast, so a double submit or a retry logs one alert and sends
 * once. A send that fails after the alert was logged returns its `alertId`
 * without revalidating: a refresh would re-render the New alert page with a
 * new key and an empty form, so the retry would log a second alert. The
 * alert pages are dynamic, so they show the alert on the next visit anyway.
 */
export async function createAlertAndSend(input: AlertSendInput): Promise<AlertSendFailure> {
  await requireOfficer();

  const parsed = alertSendSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const form = parsed.data;

  let alertId: string | undefined;
  let destination: string;
  try {
    const check = form.send ? await checkSend(form) : null;
    if (check && !check.ok) return { success: false, error: check.error };

    if (check?.existingBroadcastId) {
      destination = `/broadcasts/${check.existingBroadcastId}`;
    } else {
      const loggedId = await findOrCreateAlert(form);
      alertId = loggedId;
      if (check) {
        const result = await checkAndSend({
          idempotencyKey: form.idempotencyKey,
          content: form.content,
          loadAudience: async () => ({ ok: true, recipients: check.recipients, alertId: loggedId, retryOfId: null }),
        });
        if (!result.success) return { success: false, error: result.error, alertId };
        destination = `/broadcasts/${result.data.broadcastId}`;
      } else {
        destination = `/alerts/${loggedId}`;
      }
    }
  } catch (error) {
    // A zone deleted while the form was open fails the connect.
    console.error("createAlertAndSend failed", error);
    if (!alertId) return { success: false, error: LOG_FAILED_MESSAGE };
    return { success: false, error: SEND_FAILED_MESSAGE, alertId };
  }

  revalidateAlertPages();
  if (form.send) revalidatePath("/broadcasts", "layout");
  redirect(destination);
}

/** Marks an active alert resolved. An alert that is already resolved is left as is. */
export async function resolveAlert(id: string): Promise<ActionResult> {
  await requireOfficer();

  try {
    await prisma.hazardAlert.updateMany({
      where: { id, status: "ACTIVE" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  } catch (error) {
    console.error("resolveAlert failed", error);
    return { success: false, error: "Couldn't resolve the alert. Try again." };
  }

  revalidateAlertPages();
  return { success: true, data: undefined };
}
