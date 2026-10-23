import { timingSafeEqual } from "node:crypto";

import { applyProviderMessage } from "@/lib/broadcast/delivery";
import { createPrismaBroadcastStore } from "@/lib/broadcast/prisma-store";
import { getEnv } from "@/lib/env";
import { mapUniSmsMessage } from "@/lib/sms/unisms";
import { SmsGatewayError, type ProviderMessage } from "@/types/sms";

/** Compares the header with the secret in constant time; an unset secret rejects everything. */
function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Reads the `message` object of a `{ event, id, message }` body, or `null` when it isn't usable. */
function readMessage(body: unknown): ProviderMessage | null {
  if (!body || typeof body !== "object" || !("message" in body)) return null;
  try {
    return mapUniSmsMessage(body.message);
  } catch (error) {
    if (error instanceof SmsGatewayError) return null;
    throw error;
  }
}

/**
 * UniSMS delivery webhooks (`message.sent`, `message.failed`,
 * `message.retrying`). Answers 401 without the right `webhook-secret-key`, 400
 * for a body that isn't JSON or has no usable message, and 200 otherwise, even
 * when the message matches no recipient, so UniSMS stops retrying.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("webhook-secret-key"), getEnv().UNISMS_WEBHOOK_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const message = readMessage(body);
  if (!message) return Response.json({ error: "Unexpected payload" }, { status: 400 });

  await applyProviderMessage(message, createPrismaBroadcastStore());
  return Response.json({ ok: true });
}
